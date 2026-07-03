'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { TransactionFormData } from '@/types'
import { logActivity } from './activity'

function isPartnerPaidExpense(formData: TransactionFormData) {
  return (
    formData.type === 'expense' &&
    formData.payment_source !== 'business' &&
    Boolean(formData.payment_source)
  )
}

async function autoUpdateEquityIfEnabled(supabase: any, businessId: string) {
  const { data: business } = await supabase
    .from('businesses')
    .select('auto_update_equity_on_contribution')
    .eq('id', businessId)
    .single()

  const shouldAutoUpdate = business?.auto_update_equity_on_contribution !== false

  if (!shouldAutoUpdate) return

  const { applyEquityFromContributions } = await import('./equity')
  const equityResult = await applyEquityFromContributions(businessId, {
    skipOwnerCheck: true,
  })

  if (!equityResult.error) {
    console.log('[Auto-Update] Equity updated after personal expense contribution')
  } else {
    console.error('[Auto-Update] Failed to update equity:', equityResult.error)
  }
}

async function syncAutoContributionForTransaction(
  supabase: any,
  businessId: string,
  transactionId: string,
  formData: TransactionFormData
) {
  await deleteAutoContributionForTransaction(supabase, businessId, {
    id: transactionId,
    type: formData.type,
    payment_source: formData.payment_source,
    paid_by_user_id: formData.payment_source !== 'business' ? formData.payment_source : null,
    amount: formData.amount,
    item_name: formData.item_name || null,
    transaction_date: formData.transaction_date,
  })

  if (!isPartnerPaidExpense(formData)) return { changed: true }

  const { error } = await supabase.from('capital_contributions').insert({
    business_id: businessId,
    user_id: formData.payment_source,
    amount: formData.amount,
    type: 'from_expense',
    source_transaction_id: transactionId,
    notes: `Otomatis dari pengeluaran: ${formData.item_name || 'transaksi'} (dibayar uang pribadi)`,
    contribution_date: formData.transaction_date,
  })

  if (error) return { error: error.message }

  return { changed: true }
}

async function deleteAutoContributionForTransaction(
  supabase: any,
  businessId: string,
  transaction: {
    id: string
    type: string
    payment_source: string
    paid_by_user_id: string | null
    amount: number | string
    item_name: string | null
    transaction_date: string
  }
) {
  const { error: linkedDeleteError } = await supabase
    .from('capital_contributions')
    .delete()
    .eq('business_id', businessId)
    .eq('source_transaction_id', transaction.id)

  if (linkedDeleteError) return { error: linkedDeleteError.message }

  const paidByUserId =
    transaction.payment_source !== 'business'
      ? transaction.payment_source
      : transaction.paid_by_user_id

  if (transaction.type !== 'expense' || !paidByUserId) {
    return { success: true }
  }

  const legacyAutoNote = `Otomatis dari pengeluaran: ${transaction.item_name || 'transaksi'} (dibayar uang pribadi)`

  const { data: legacyContributions, error: legacyFindError } = await supabase
    .from('capital_contributions')
    .select('id')
    .eq('business_id', businessId)
    .eq('user_id', paidByUserId)
    .eq('amount', Number(transaction.amount))
    .eq('type', 'additional')
    .is('source_transaction_id', null)
    .eq('contribution_date', transaction.transaction_date)
    .eq('notes', legacyAutoNote)

  if (legacyFindError) return { error: legacyFindError.message }

  const legacyIds = legacyContributions?.map((c: { id: string }) => c.id) || []

  if (legacyIds.length === 0) return { success: true }

  const { error: legacyDeleteError } = await supabase
    .from('capital_contributions')
    .delete()
    .in('id', legacyIds)

  if (legacyDeleteError) return { error: legacyDeleteError.message }

  return { success: true }
}

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
    .select('role')
    .eq('business_id', businessId)
    .eq('user_id', user.id)
    .single()

  if (!member) {
    return { error: 'Anda bukan anggota bisnis ini' }
  }

  if (
    isPartnerPaidExpense(formData) &&
    member.role !== 'owner' &&
    formData.payment_source !== user.id
  ) {
    return { error: 'Anda hanya dapat mencatat pengeluaran pribadi atas nama sendiri' }
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
  if (isPartnerPaidExpense(formData)) {
    const contributionResult = await syncAutoContributionForTransaction(
      supabase,
      businessId,
      transaction.id,
      formData
    )

    if (contributionResult.error) {
      console.error('Failed to create auto capital contribution:', contributionResult.error)
      return { error: contributionResult.error }
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

      await autoUpdateEquityIfEnabled(supabase, businessId)
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
    .select('role')
    .eq('business_id', businessId)
    .eq('user_id', user.id)
    .single()

  if (!member) {
    return { error: 'Anda bukan anggota bisnis ini' }
  }

  if (
    isPartnerPaidExpense(formData) &&
    member.role !== 'owner' &&
    formData.payment_source !== user.id
  ) {
    return { error: 'Anda hanya dapat mencatat pengeluaran pribadi atas nama sendiri' }
  }

  const { data: existingTransaction } = await supabase
    .from('transactions')
    .select('id, type, amount, payment_source, paid_by_user_id, item_name, transaction_date')
    .eq('id', transactionId)
    .eq('business_id', businessId)
    .single()

  if (!existingTransaction) {
    return { error: 'Transaksi tidak ditemukan' }
  }

  if (formData.type === 'expense' && formData.payment_source === 'business') {
    const { getBusinessCash } = await import('@/lib/supabase/queries')
    const businessCash = await getBusinessCash(businessId)
    const previousBusinessExpense =
      existingTransaction.type === 'expense' &&
      existingTransaction.payment_source === 'business'
        ? Number(existingTransaction.amount)
        : 0
    const availableCashForEdit = businessCash + previousBusinessExpense

    if (formData.amount > availableCashForEdit) {
      return {
        error: `Kas bisnis tidak mencukupi. Kas tersedia: Rp ${availableCashForEdit.toLocaleString('id-ID')}. Gunakan "Dibayar oleh mitra" jika ingin bayar pakai uang pribadi.`,
      }
    }
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

  const oldContributionDelete = await deleteAutoContributionForTransaction(
    supabase,
    businessId,
    existingTransaction
  )

  if (oldContributionDelete.error) {
    return { error: oldContributionDelete.error }
  }

  const contributionResult = await syncAutoContributionForTransaction(
    supabase,
    businessId,
    transactionId,
    formData
  )

  if (contributionResult.error) {
    return { error: contributionResult.error }
  }

  await autoUpdateEquityIfEnabled(supabase, businessId)

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

  const { data: transactionToDelete } = await supabase
    .from('transactions')
    .select('id, type, amount, payment_source, paid_by_user_id, item_name, transaction_date')
    .eq('id', transactionId)
    .eq('business_id', businessId)
    .single()

  if (!transactionToDelete) {
    return { error: 'Transaksi tidak ditemukan' }
  }

  const contributionDelete = await deleteAutoContributionForTransaction(
    supabase,
    businessId,
    transactionToDelete
  )

  if (contributionDelete.error) {
    return { error: contributionDelete.error }
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
  revalidatePath(`/bisnis/${businessId}/modal`)
  revalidatePath(`/bisnis/${businessId}`)
  await autoUpdateEquityIfEnabled(supabase, businessId)
  return { success: true }
}
