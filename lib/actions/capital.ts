'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { CapitalContributionFormData, WithdrawalFormData } from '@/types'
import { logActivity } from './activity'

export async function createCapitalContribution(
  businessId: string,
  formData: CapitalContributionFormData
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

  // Create capital contribution
  const { data: contribution, error: contributionError } = await supabase
    .from('capital_contributions')
    .insert({
      business_id: businessId,
      user_id: formData.user_id,
      amount: formData.amount,
      type: formData.type,
      notes: formData.notes || null,
      contribution_date: formData.contribution_date,
      created_by: user.id,
    })
    .select()
    .single()

  if (contributionError) {
    return { error: contributionError.message }
  }

  // Log activity
  await logActivity({
    business_id: businessId,
    user_id: user.id,
    action: 'capital_contribution',
    entity_type: 'capital_contribution',
    entity_id: contribution.id,
    details: {
      contribution_id: contribution.id,
      amount: formData.amount,
      type: formData.type,
      description: `Kontribusi modal ${formData.type === 'initial' ? 'awal' : 'tambahan'} sebesar Rp ${formData.amount.toLocaleString('id-ID')}`,
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
    // Auto-update equity based on new contributions
    const { applyEquityFromContributions } = await import('./equity')
    const equityResult = await applyEquityFromContributions(businessId, {
      skipOwnerCheck: true, // Allow any member to trigger auto-update
    })

    if (!equityResult.error) {
      console.log('[Auto-Update] Equity updated after contribution')
    } else {
      console.error('[Auto-Update] Failed to update equity:', equityResult.error)
    }
  }

  revalidatePath(`/bisnis/${businessId}/modal`)
  revalidatePath(`/bisnis/${businessId}`)
  return { success: true, contributionId: contribution.id }
}

export async function createWithdrawal(
  businessId: string,
  formData: WithdrawalFormData
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

  // Calculate user's profit balance from transactions (same as UI)
  // Get all transactions to calculate total profit
  const { data: transactions } = await supabase
    .from('transactions')
    .select('type, amount')
    .eq('business_id', businessId)

  let totalRevenue = 0
  let totalExpense = 0
  transactions?.forEach((t) => {
    const amount = Number(t.amount)
    if (t.type === 'revenue') {
      totalRevenue += amount
    } else {
      totalExpense += amount
    }
  })
  const totalBusinessProfit = totalRevenue - totalExpense

  // Get user's equity percentage
  const { data: memberData } = await supabase
    .from('business_members')
    .select('equity_percentage')
    .eq('business_id', businessId)
    .eq('user_id', user.id)
    .single()

  const equityPercentage = Number(memberData?.equity_percentage || 0)
  const userProfitShare = totalBusinessProfit * (equityPercentage / 100)

  // Get existing withdrawals
  const { data: withdrawals } = await supabase
    .from('withdrawals')
    .select('amount')
    .eq('business_id', businessId)
    .eq('user_id', user.id)

  const totalWithdrawals =
    withdrawals?.reduce((sum, w) => sum + Number(w.amount), 0) || 0

  // Only profit can be withdrawn (contributions are permanent equity)
  const withdrawableBalance = userProfitShare - totalWithdrawals

  if (formData.amount > withdrawableBalance) {
    return {
      error: `Saldo laba tidak mencukupi. Saldo yang dapat ditarik: Rp ${withdrawableBalance.toLocaleString('id-ID')}`,
    }
  }

  // Validate business cash is sufficient
  const { getBusinessCash } = await import('@/lib/supabase/queries')
  const businessCash = await getBusinessCash(businessId)

  if (formData.amount > businessCash) {
    return {
      error: `Kas bisnis tidak mencukupi untuk penarikan ini. Kas tersedia: Rp ${businessCash.toLocaleString('id-ID')}. Saldo laba Anda: Rp ${withdrawableBalance.toLocaleString('id-ID')}.`,
    }
  }

  // Create withdrawal
  const { data: withdrawal, error: withdrawalError } = await supabase
    .from('withdrawals')
    .insert({
      business_id: businessId,
      user_id: user.id,
      amount: formData.amount,
      notes: formData.notes || null,
      withdrawal_date: formData.withdrawal_date,
      created_by: user.id,
    })
    .select()
    .single()

  if (withdrawalError) {
    return { error: withdrawalError.message }
  }

  // Log activity
  await logActivity({
    business_id: businessId,
    user_id: user.id,
    action: 'capital_withdrawal',
    entity_type: 'withdrawal',
    entity_id: withdrawal.id,
    details: {
      withdrawal_id: withdrawal.id,
      amount: formData.amount,
      description: `Penarikan modal sebesar Rp ${formData.amount.toLocaleString('id-ID')}`,
    },
  })

  revalidatePath(`/bisnis/${businessId}/modal`)
  revalidatePath(`/bisnis/${businessId}`)
  return { success: true, withdrawalId: withdrawal.id }
}

export async function deleteCapitalContribution(
  contributionId: string,
  businessId: string
) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Tidak terautentikasi' }
  }

  // Verify user is owner
  const { data: member } = await supabase
    .from('business_members')
    .select('role')
    .eq('business_id', businessId)
    .eq('user_id', user.id)
    .single()

  if (!member || member.role !== 'owner') {
    return { error: 'Hanya pemilik yang dapat menghapus kontribusi modal' }
  }

  // Delete contribution
  const { error } = await supabase
    .from('capital_contributions')
    .delete()
    .eq('id', contributionId)

  if (error) {
    return { error: error.message }
  }

  // Log activity
  await logActivity({
    business_id: businessId,
    user_id: user.id,
    action: 'capital_contribution_deleted',
    entity_type: 'capital_contribution',
    entity_id: contributionId,
    details: {
      contribution_id: contributionId,
      description: 'Kontribusi modal dihapus',
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
    // Auto-update equity after deletion
    const { applyEquityFromContributions } = await import('./equity')
    const equityResult = await applyEquityFromContributions(businessId, {
      skipOwnerCheck: true, // Allow any member to trigger auto-update
    })

    if (!equityResult.error) {
      console.log('[Auto-Update] Equity updated after contribution deletion')
    } else {
      console.error('[Auto-Update] Failed to update equity:', equityResult.error)
    }
  }

  revalidatePath(`/bisnis/${businessId}/modal`)
  return { success: true }
}

export async function createGroupWithdrawal(
  businessId: string,
  formData: {
    percentage: number
    withdrawal_date: string
    notes?: string
  }
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Tidak terautentikasi' }
  }

  // Verify user is owner
  const { data: member } = await supabase
    .from('business_members')
    .select('role')
    .eq('business_id', businessId)
    .eq('user_id', user.id)
    .single()

  if (!member || member.role !== 'owner') {
    return { error: 'Hanya pemilik yang dapat melakukan penarikan bersama' }
  }

  // Get all members
  const { data: members } = await supabase
    .from('business_members')
    .select('user_id, equity_percentage')
    .eq('business_id', businessId)

  if (!members || members.length === 0) {
    return { error: 'Tidak ada mitra ditemukan' }
  }

  // Get transactions for profit calculation
  const { data: transactions } = await supabase
    .from('transactions')
    .select('type, amount')
    .eq('business_id', businessId)

  let totalRevenue = 0
  let totalExpense = 0
  transactions?.forEach((t) => {
    if (t.type === 'revenue') totalRevenue += Number(t.amount)
    else totalExpense += Number(t.amount)
  })
  const totalProfit = totalRevenue - totalExpense

  // Get existing withdrawals
  const { data: withdrawals } = await supabase
    .from('withdrawals')
    .select('user_id, amount')
    .eq('business_id', businessId)

  // Calculate and create withdrawals
  const withdrawalsToCreate: Array<{
    business_id: string
    user_id: string
    amount: number
    notes: string
    withdrawal_date: string
    created_by: string
  }> = []

  for (const m of members) {
    // Only profit can be withdrawn (contributions are permanent equity)
    const profitShare = totalProfit * (Number(m.equity_percentage) / 100)
    const userWithdraws = withdrawals?.filter((w) => w.user_id === m.user_id).reduce((sum, w) => sum + Number(w.amount), 0) || 0
    const withdrawableBalance = profitShare - userWithdraws
    const amount = Math.floor(withdrawableBalance * (formData.percentage / 100))

    if (amount > 0) {
      withdrawalsToCreate.push({
        business_id: businessId,
        user_id: m.user_id,
        amount,
        notes: formData.notes || 'Penarikan bersama ' + formData.percentage + '%',
        withdrawal_date: formData.withdrawal_date,
        created_by: user.id,
      })
    }
  }

  if (withdrawalsToCreate.length === 0) {
    return { error: 'Tidak ada mitra dengan saldo cukup' }
  }

  // Validate business cash is sufficient for total withdrawal
  const totalWithdrawalAmount = withdrawalsToCreate.reduce((sum, w) => sum + w.amount, 0)
  const { getBusinessCash } = await import('@/lib/supabase/queries')
  const businessCash = await getBusinessCash(businessId)

  if (totalWithdrawalAmount > businessCash) {
    return {
      error: `Kas bisnis tidak mencukupi untuk penarikan bersama ini. Kas tersedia: Rp ${businessCash.toLocaleString('id-ID')}. Total penarikan: Rp ${totalWithdrawalAmount.toLocaleString('id-ID')}.`,
    }
  }

  const { error: insertError } = await supabase.from('withdrawals').insert(withdrawalsToCreate)
  if (insertError) return { error: insertError.message }

  const totalAmount = withdrawalsToCreate.reduce((sum, w) => sum + w.amount, 0)
  await logActivity({
    business_id: businessId,
    user_id: user.id,
    action: 'group_withdrawal',
    entity_type: 'withdrawal',
    entity_id: businessId,
    details: {
      percentage: formData.percentage,
      total_amount: totalAmount,
      partner_count: withdrawalsToCreate.length,
      description: 'Penarikan bersama ' + formData.percentage + '% untuk ' + withdrawalsToCreate.length + ' mitra',
    },
  })

  revalidatePath(`/bisnis/${businessId}/modal`)
  revalidatePath(`/bisnis/${businessId}`)
  return { success: true, count: withdrawalsToCreate.length, totalAmount }
}
export async function deleteWithdrawal(withdrawalId: string, businessId: string) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Tidak terautentikasi' }
  }

  // Verify user is owner
  const { data: member } = await supabase
    .from('business_members')
    .select('role')
    .eq('business_id', businessId)
    .eq('user_id', user.id)
    .single()

  if (!member || member.role !== 'owner') {
    return { error: 'Hanya pemilik yang dapat menghapus penarikan modal' }
  }

  // Delete withdrawal
  const { error } = await supabase
    .from('withdrawals')
    .delete()
    .eq('id', withdrawalId)

  if (error) {
    return { error: error.message }
  }

  // Log activity
  await logActivity({
    business_id: businessId,
    user_id: user.id,
    action: 'capital_withdrawal_deleted',
    entity_type: 'withdrawal',
    entity_id: withdrawalId,
    details: {
      withdrawal_id: withdrawalId,
      description: 'Penarikan modal dihapus',
    },
  })

  revalidatePath(`/bisnis/${businessId}/modal`)
  return { success: true }
}
