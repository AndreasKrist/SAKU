'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { ProfitDistributionFormData } from '@/types'
import { logActivity } from './activity'
import { calculateProfitLoss } from '@/lib/supabase/queries'

export async function distributeProfits(
  businessId: string,
  formData: ProfitDistributionFormData
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
    return { error: 'Hanya pemilik yang dapat mendistribusikan laba' }
  }

  // Calculate profit for the period
  const profitLoss = await calculateProfitLoss(
    businessId,
    formData.period_start,
    formData.period_end
  )

  if (profitLoss.net_profit <= 0) {
    return { error: 'Tidak ada laba untuk periode ini' }
  }

  // Calculate amount to distribute
  const amountToDistribute =
    profitLoss.net_profit * (formData.distribution_percentage / 100)

  // Calculate retained amount
  const retainedAmount = profitLoss.net_profit - amountToDistribute

  // Create profit distribution record
  const { data: distribution, error: distributionError } = await supabase
    .from('profit_distributions')
    .insert({
      business_id: businessId,
      period_start: formData.period_start,
      period_end: formData.period_end,
      total_profit: profitLoss.net_profit,
      distributed_amount: amountToDistribute,
      retained_amount: retainedAmount,
      distribution_percentage: formData.distribution_percentage,
      distribution_date: new Date().toISOString().split('T')[0],
      created_by: user.id,
    })
    .select()
    .single()

  if (distributionError) {
    return { error: distributionError.message }
  }

  // Get all members with their equity
  const { data: members, error: membersError } = await supabase
    .from('business_members')
    .select('user_id, equity_percentage, profile:profiles(full_name)')
    .eq('business_id', businessId)

  if (membersError) {
    return { error: membersError.message }
  }

  // Create allocations for each member based on equity
  for (const member of members) {
    const allocatedAmount =
      amountToDistribute * (Number(member.equity_percentage) / 100)

    const { error: allocationError } = await supabase
      .from('profit_allocations')
      .insert({
        distribution_id: distribution.id,
        user_id: member.user_id,
        equity_percentage: member.equity_percentage,
        allocated_amount: allocatedAmount,
      })

    if (allocationError) {
      console.error('Failed to create allocation:', allocationError)
    }
  }

  // Log activity
  await logActivity({
    business_id: businessId,
    user_id: user.id,
    action: 'profit_distributed',
    entity_type: 'profit_distribution',
    entity_id: distribution.id,
    details: {
      distribution_id: distribution.id,
      total_profit: profitLoss.net_profit,
      distributed_amount: amountToDistribute,
      period_start: formData.period_start,
      period_end: formData.period_end,
      description: `Distribusi laba sebesar Rp ${amountToDistribute.toLocaleString('id-ID')} (${formData.distribution_percentage}% dari total laba)`,
    },
  })

  revalidatePath(`/bisnis/${businessId}/distribusi-laba`)
  revalidatePath(`/bisnis/${businessId}`)
  return { success: true, distributionId: distribution.id }
}

export async function deleteProfitDistribution(
  distributionId: string,
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
    return { error: 'Hanya pemilik yang dapat menghapus distribusi laba' }
  }

  // Delete allocations first (will cascade, but being explicit)
  await supabase
    .from('profit_allocations')
    .delete()
    .eq('distribution_id', distributionId)

  // Delete distribution
  const { error } = await supabase
    .from('profit_distributions')
    .delete()
    .eq('id', distributionId)

  if (error) {
    return { error: error.message }
  }

  // Log activity
  await logActivity({
    business_id: businessId,
    user_id: user.id,
    action: 'profit_distribution_deleted',
    entity_type: 'profit_distribution',
    entity_id: distributionId,
    details: {
      distribution_id: distributionId,
      description: 'Distribusi laba dihapus',
    },
  })

  revalidatePath(`/bisnis/${businessId}/distribusi-laba`)
  return { success: true }
}
