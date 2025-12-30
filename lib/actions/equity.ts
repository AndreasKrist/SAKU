'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Calculate equity percentages based on capital contributions
 * If no contributions exist, split equity evenly among all members
 * Returns suggested equity distribution based on total contributions or even split
 */
export async function calculateEquityFromContributions(businessId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Tidak terautentikasi' }
  }

  // Get all members
  const { data: members, error: membersError } = await supabase
    .from('business_members')
    .select('user_id, profile:profiles(full_name)')
    .eq('business_id', businessId)

  if (membersError) {
    return { error: membersError.message }
  }

  if (!members || members.length === 0) {
    return { error: 'Tidak ada anggota dalam bisnis ini' }
  }

  // Get all capital contributions
  const { data: contributions, error: contributionsError } = await supabase
    .from('capital_contributions')
    .select('user_id, amount')
    .eq('business_id', businessId)

  if (contributionsError) {
    return { error: contributionsError.message }
  }

  // Calculate total contributions per member
  const memberContributions = new Map<string, number>()
  let totalContributions = 0

  contributions?.forEach((contrib) => {
    const current = memberContributions.get(contrib.user_id) || 0
    const amount = Number(contrib.amount)
    memberContributions.set(contrib.user_id, current + amount)
    totalContributions += amount
  })

  // If no contributions yet, split equity evenly
  if (totalContributions === 0) {
    const evenPercentage = 100 / members.length
    const distributions = members.map((member) => ({
      userId: member.user_id,
      userName: member.profile?.full_name || 'Unknown',
      contribution: 0,
      percentage: Math.round(evenPercentage * 100) / 100, // Round to 2 decimals
    }))

    return {
      success: true,
      distributions,
      totalContributions: 0,
      method: 'even_split' as const
    }
  }

  // Calculate equity percentages based on contribution ratio
  const distributions = members.map((member) => {
    const contribution = memberContributions.get(member.user_id) || 0
    const percentage = (contribution / totalContributions) * 100

    return {
      userId: member.user_id,
      userName: member.profile?.full_name || 'Unknown',
      contribution: contribution,
      percentage: Math.round(percentage * 100) / 100, // Round to 2 decimals
    }
  })

  return {
    success: true,
    distributions,
    totalContributions,
    method: 'contribution_based' as const
  }
}

/**
 * Apply equity distribution calculated from contributions
 */
export async function applyEquityFromContributions(businessId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Tidak terautentikasi' }
  }

  // Verify user is owner
  const { data: membership } = await supabase
    .from('business_members')
    .select('role')
    .eq('business_id', businessId)
    .eq('user_id', user.id)
    .single()

  if (!membership || membership.role !== 'owner') {
    return { error: 'Hanya pemilik yang dapat mengubah distribusi ekuitas' }
  }

  // Calculate equity from contributions
  const result = await calculateEquityFromContributions(businessId)

  if (result.error || !result.distributions) {
    return { error: result.error }
  }

  // Validate total equals 100%
  const total = result.distributions.reduce((sum, d) => sum + d.percentage, 0)
  if (Math.abs(total - 100) > 0.01) {
    return {
      error: `Total ekuitas ${total.toFixed(2)}% tidak tepat 100%. Silakan atur manual.`,
      distributions: result.distributions
    }
  }

  // Create service role client to bypass RLS
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { error: 'Konfigurasi server tidak lengkap' }
  }

  const supabaseWithAuth = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    }
  )

  // Update all members
  for (const dist of result.distributions) {
    const { error } = await supabaseWithAuth
      .from('business_members')
      .update({ equity_percentage: dist.percentage })
      .eq('business_id', businessId)
      .eq('user_id', dist.userId)

    if (error) {
      return { error: error.message }
    }
  }

  // Log activity
  await supabaseWithAuth.from('activity_logs').insert({
    business_id: businessId,
    user_id: user.id,
    action: 'equity_auto_calculated',
    entity_type: 'business',
    entity_id: businessId,
    details: {
      distributions: result.distributions,
      source: 'capital_contributions'
    },
  })

  revalidatePath(`/bisnis/${businessId}`)
  return { success: true, distributions: result.distributions }
}

/**
 * Split equity evenly among all members
 * Useful for partnerships where everyone has equal ownership regardless of capital
 */
export async function splitEquityEvenly(businessId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Tidak terautentikasi' }
  }

  // Verify user is owner
  const { data: membership } = await supabase
    .from('business_members')
    .select('role')
    .eq('business_id', businessId)
    .eq('user_id', user.id)
    .single()

  if (!membership || membership.role !== 'owner') {
    return { error: 'Hanya pemilik yang dapat mengubah distribusi ekuitas' }
  }

  // Get all members
  const { data: members, error: membersError } = await supabase
    .from('business_members')
    .select('user_id, profile:profiles(full_name)')
    .eq('business_id', businessId)

  if (membersError) {
    return { error: membersError.message }
  }

  if (!members || members.length === 0) {
    return { error: 'Tidak ada anggota dalam bisnis ini' }
  }

  // Calculate even split
  const evenPercentage = 100 / members.length
  const distributions = members.map((member) => ({
    userId: member.user_id,
    userName: member.profile?.full_name || 'Unknown',
    percentage: Math.round(evenPercentage * 100) / 100,
  }))

  // Create service role client to bypass RLS
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { error: 'Konfigurasi server tidak lengkap' }
  }

  const supabaseWithAuth = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    }
  )

  // Update all members
  for (const dist of distributions) {
    const { error } = await supabaseWithAuth
      .from('business_members')
      .update({ equity_percentage: dist.percentage })
      .eq('business_id', businessId)
      .eq('user_id', dist.userId)

    if (error) {
      return { error: error.message }
    }
  }

  // Log activity
  await supabaseWithAuth.from('activity_logs').insert({
    business_id: businessId,
    user_id: user.id,
    action: 'equity_split_evenly',
    entity_type: 'business',
    entity_id: businessId,
    details: {
      distributions,
      method: 'even_split'
    },
  })

  revalidatePath(`/bisnis/${businessId}`)
  return { success: true, distributions }
}
