'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { TransactionFormData } from '@/types'
import { logActivity } from './activity'

export async function createTransaction(
  businessId: string,
  formData: TransactionFormData
) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Tidak terautentikasi' }
  }

  // Verify user is member of business
  const { data: member } = await supabase
    .from('business_members')
    .select('id')
    .eq('business_id', businessId)
    .eq('user_id', user.id)
    .single()

  if (!member) {
    return { error: 'Anda bukan anggota bisnis ini' }
  }

  // Validate business cash if expense is paid from business
  if (formData.type === 'expense' && formData.payment_source === 'business') {
    const { getBusinessCash } = await import('@/lib/supabase/queries')
    const businessCash = await getBusinessCash(businessId)

    if (formData.amount > businessCash) {
      return {
        error: `Kas bisnis tidak mencukupi. Kas tersedia: Rp ${businessCash.toLocaleString('id-ID')}. Gunakan "Dibayar oleh mitra" jika ingin bayar pakai uang pribadi.`,
      }
    }
  }

  // Create transaction
  const { data: transaction, error: transactionError } = await supabase
    .from('transactions')
    .insert({
      business_id: businessId,
      category_id: formData.category_id || null,
      amount: formData.amount,
      type: formData.type,
      payment_source: formData.payment_source,
      paid_by_user_id:
        formData.payment_source !== 'business'
          ? formData.payment_source
          : null,
      item_name: formData.item_name || null,
      quantity: formData.quantity || null,
      quantity_unit: formData.quantity_unit || null,
      notes: formData.notes || null,
      transaction_date: formData.transaction_date,
      created_by: user.id,
    })
    .select()
    .single()

  if (transactionError) {
    return { error: transactionError.message }
  }

  // CRITICAL: If expense paid by partner (not business), auto-create capital contribution
  // This increases their equity percentage automatically
  if (
    formData.type === 'expense' &&
    formData.payment_source !== 'business' &&
    formData.payment_source
  ) {
    const { error: capitalError } = await supabase
      .from('capital_contributions')
      .insert({
        business_id: businessId,
        user_id: formData.payment_source,
        amount: formData.amount,
        type: 'additional',
        notes: `Otomatis dari pengeluaran: ${formData.item_name || 'transaksi'} (dibayar uang pribadi)`,
        contribution_date: formData.transaction_date,
        created_by: user.id,
      })

    if (capitalError) {
      console.error('Failed to create auto capital contribution:', capitalError)
      // Don't fail the whole transaction, just log it
    } else {
      // Log the auto capital contribution
      await logActivity({
        business_id: businessId,
        user_id: user.id,
        action: 'capital_contribution_auto',
        entity_type: 'capital_contribution',
        entity_id: transaction.id,
        details: {
          transaction_id: transaction.id,
          amount: formData.amount,
          description: `Kontribusi modal otomatis dari pembayaran pengeluaran`,
        },
      })

      // Auto-update equity by default (can be disabled in settings)
      const { data: business } = await supabase
        .from('businesses')
        .select('auto_update_equity_on_contribution')
        .eq('id', businessId)
        .single()

      // Default to TRUE if field doesn't exist or is null
      const shouldAutoUpdate = business?.auto_update_equity_on_contribution !== false

      if (shouldAutoUpdate) {
        const { applyEquityFromContributions } = await import('./equity')
        const equityResult = await applyEquityFromContributions(businessId, {
          skipOwnerCheck: true, // Allow any member to trigger auto-update
        })

        if (!equityResult.error) {
          console.log('[Auto-Update] Equity updated after personal expense contribution')
        } else {
          console.error('[Auto-Update] Failed to update equity:', equityResult.error)
        }
      }
    }
  }

  // Log activity
  const actionType =
    formData.type === 'revenue' ? 'transaction_revenue' : 'transaction_expense'
  await logActivity({
    business_id: businessId,
    user_id: user.id,
    action: actionType,
    entity_type: 'transaction',
    entity_id: transaction.id,
    details: {
      transaction_id: transaction.id,
      amount: formData.amount,
      description: `${formData.type === 'revenue' ? 'Pendapatan' : 'Pengeluaran'} ${formData.item_name || ''} sebesar Rp ${formData.amount.toLocaleString('id-ID')}`,
    },
  })

  revalidatePath(`/bisnis/${businessId}/transaksi`)
  revalidatePath(`/bisnis/${businessId}`)
  return { success: true, transactionId: transaction.id }
}

export async function updateTransaction(
  transactionId: string,
  businessId: string,
  formData: TransactionFormData
) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Tidak terautentikasi' }
  }

  // Verify user is member of business
  const { data: member } = await supabase
    .from('business_members')
    .select('id')
    .eq('business_id', businessId)
    .eq('user_id', user.id)
    .single()

  if (!member) {
    return { error: 'Anda bukan anggota bisnis ini' }
  }

  // Update transaction
  const { error } = await supabase
    .from('transactions')
    .update({
      category_id: formData.category_id || null,
      amount: formData.amount,
      type: formData.type,
      payment_source: formData.payment_source,
      paid_by_user_id:
        formData.payment_source !== 'business'
          ? formData.payment_source
          : null,
      item_name: formData.item_name || null,
      quantity: formData.quantity || null,
      quantity_unit: formData.quantity_unit || null,
      notes: formData.notes || null,
      transaction_date: formData.transaction_date,
    })
    .eq('id', transactionId)

  if (error) {
    return { error: error.message }
  }

  // Log activity
  await logActivity({
    business_id: businessId,
    user_id: user.id,
    action: 'transaction_updated',
    entity_type: 'transaction',
    entity_id: transactionId,
    details: {
      transaction_id: transactionId,
      description: 'Transaksi diperbarui',
    },
  })

  revalidatePath(`/bisnis/${businessId}/transaksi`)
  revalidatePath(`/bisnis/${businessId}`)
  return { success: true }
}

export async function deleteTransaction(transactionId: string, businessId: string) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Tidak terautentikasi' }
  }

  // Verify user is member of business
  const { data: member } = await supabase
    .from('business_members')
    .select('role')
    .eq('business_id', businessId)
    .eq('user_id', user.id)
    .single()

  if (!member) {
    return { error: 'Anda bukan anggota bisnis ini' }
  }

  // Only owner can delete
  if (member.role !== 'owner') {
    return { error: 'Hanya pemilik yang dapat menghapus transaksi' }
  }

  // Delete transaction
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', transactionId)

  if (error) {
    return { error: error.message }
  }

  // Log activity
  await logActivity({
    business_id: businessId,
    user_id: user.id,
    action: 'transaction_deleted',
    entity_type: 'transaction',
    entity_id: transactionId,
    details: {
      transaction_id: transactionId,
      description: 'Transaksi dihapus',
    },
  })

  revalidatePath(`/bisnis/${businessId}/transaksi`)
  revalidatePath(`/bisnis/${businessId}`)
  return { success: true }
}
