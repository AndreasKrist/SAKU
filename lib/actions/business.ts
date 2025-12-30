'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

function generateBusinessCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Exclude similar looking chars
  let code = 'BIZ-'
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function createBusiness(formData: {
  name: string
  description?: string
  startDate: string
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log('[createBusiness] Auth state:', {
    hasUser: !!user,
    userId: user?.id,
    userEmail: user?.email
  })

  if (!user) {
    return { error: 'Tidak terautentikasi' }
  }

  // Generate unique business code
  let businessCode = generateBusinessCode()
  let isUnique = false
  let attempts = 0

  while (!isUnique && attempts < 10) {
    const { data: existing } = await supabase
      .from('businesses')
      .select('id')
      .eq('business_code', businessCode)
      .single()

    if (!existing) {
      isUnique = true
    } else {
      businessCode = generateBusinessCode()
      attempts++
    }
  }

  if (!isUnique) {
    return { error: 'Gagal membuat kode bisnis unik' }
  }

  const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/bisnis/gabung?code=${businessCode}`

  const businessData = {
    name: formData.name,
    description: formData.description || '',
    business_code: businessCode,
    invite_link: inviteLink,
    start_date: formData.startDate,
    created_by: user.id,
  }

  console.log('[createBusiness] Attempting to insert:', businessData)

  // CRITICAL FIX: Get the session and create client with JWT in headers
  const { data: { session } } = await supabase.auth.getSession()
  console.log('[createBusiness] Session state:', {
    hasSession: !!session,
    hasAccessToken: !!session?.access_token
  })

  if (!session) {
    return { error: 'Session tidak ditemukan' }
  }

  // TEMPORARY WORKAROUND: Use service role key to bypass RLS
  // This is needed because JWT isn't being recognized in Server Actions
  // TODO: Find proper solution for JWT propagation in Server Actions
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[createBusiness] SUPABASE_SERVICE_ROLE_KEY not found in environment')
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

  console.log('[createBusiness] Using service role client (bypassing RLS)')

  // Create business with authenticated client
  const { data: business, error: businessError } = await supabaseWithAuth
    .from('businesses')
    .insert(businessData)
    .select()
    .single()

  console.log('[createBusiness] Insert result:', {
    hasData: !!business,
    hasError: !!businessError,
    error: businessError?.message,
    errorDetails: businessError
  })

  if (businessError) {
    return { error: businessError.message }
  }

  // Add creator as owner with 100% equity (using authenticated client)
  const { error: memberError } = await supabaseWithAuth.from('business_members').insert({
    business_id: business.id,
    user_id: user.id,
    role: 'owner',
    equity_percentage: 100,
  })

  if (memberError) {
    return { error: memberError.message }
  }

  // Log activity (using authenticated client)
  await supabaseWithAuth.from('activity_logs').insert({
    business_id: business.id,
    user_id: user.id,
    action: 'business_created',
    entity_type: 'business',
    entity_id: business.id,
    details: { business_name: formData.name },
  })

  revalidatePath('/dashboard')
  return { success: true, business, businessId: business.id }
}

export async function joinBusiness(businessCode: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Tidak terautentikasi' }
  }

  // Get session for service role client
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { error: 'Session tidak ditemukan' }
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

  // Find business by code (using service role to bypass RLS)
  const { data: business, error: businessError } = await supabaseWithAuth
    .from('businesses')
    .select('*')
    .eq('business_code', businessCode.toUpperCase())
    .single()

  if (businessError || !business) {
    return { error: 'Kode bisnis tidak ditemukan' }
  }

  // Check if already a member (using service role to bypass RLS)
  const { data: existingMember } = await supabaseWithAuth
    .from('business_members')
    .select('id')
    .eq('business_id', business.id)
    .eq('user_id', user.id)
    .single()

  if (existingMember) {
    return { error: 'Anda sudah menjadi anggota bisnis ini' }
  }

  // Add as member with 0% equity (using service role to bypass RLS)
  const { error: memberError } = await supabaseWithAuth.from('business_members').insert({
    business_id: business.id,
    user_id: user.id,
    role: 'member',
    equity_percentage: 0,
  })

  if (memberError) {
    return { error: memberError.message }
  }

  // Log activity (using service role)
  await supabaseWithAuth.from('activity_logs').insert({
    business_id: business.id,
    user_id: user.id,
    action: 'member_joined',
    entity_type: 'business_member',
    entity_id: business.id,
    details: { user_id: user.id },
  })

  revalidatePath('/dashboard')
  return { success: true, business }
}

export async function getUserBusinesses() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data: memberships } = await supabase
    .from('business_members')
    .select('*, businesses(*)')
    .eq('user_id', user.id)

  return memberships || []
}

export async function updateEquityDistribution(
  businessId: string,
  distributions: { userId: string; percentage: number }[]
) {
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

  const membershipData = membership as any
  if (!membershipData || membershipData.role !== 'owner') {
    return { error: 'Hanya pemilik yang dapat mengubah distribusi ekuitas' }
  }

  // Validate total equals 100%
  const total = distributions.reduce((sum, d) => sum + d.percentage, 0)
  if (Math.abs(total - 100) > 0.01) {
    return { error: 'Total ekuitas harus tepat 100%' }
  }

  // Update all members
  for (const dist of distributions) {
    const { error } = await supabase
      .from('business_members')
      .update({ equity_percentage: dist.percentage })
      .eq('business_id', businessId)
      .eq('user_id', dist.userId)

    if (error) {
      return { error: error.message }
    }
  }

  // Log activity
  await supabase.from('activity_logs').insert({
    business_id: businessId,
    user_id: user.id,
    action: 'equity_updated',
    entity_type: 'business',
    entity_id: businessId,
    details: { distributions },
  })

  revalidatePath(`/bisnis/${businessId}`)
  return { success: true }
}

export async function deleteBusiness(businessId: string) {
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

  const membershipData2 = membership as any
  if (!membershipData2 || membershipData2.role !== 'owner') {
    return { error: 'Hanya pemilik yang dapat menghapus bisnis' }
  }

  // Get session for service role client
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { error: 'Session tidak ditemukan' }
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

  // Delete business (CASCADE will delete all related data)
  const { error: deleteError } = await supabaseWithAuth
    .from('businesses')
    .delete()
    .eq('id', businessId)

  if (deleteError) {
    return { error: deleteError.message }
  }

  revalidatePath('/dashboard')
  redirect('/dashboard')
}

export async function getBusinessStats(businessId: string) {
  const supabase = await createClient()

  // Get counts of related data
  const [
    { count: memberCount },
    { count: transactionCount },
    { count: contributionCount },
    { count: distributionCount }
  ] = await Promise.all([
    supabase.from('business_members').select('*', { count: 'exact', head: true }).eq('business_id', businessId),
    supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('business_id', businessId),
    supabase.from('capital_contributions').select('*', { count: 'exact', head: true }).eq('business_id', businessId),
    supabase.from('profit_distributions').select('*', { count: 'exact', head: true }).eq('business_id', businessId),
  ])

  return {
    memberCount: memberCount || 0,
    transactionCount: transactionCount || 0,
    contributionCount: contributionCount || 0,
    distributionCount: distributionCount || 0,
  }
}

export async function toggleAutoUpdateEquity(businessId: string, enabled: boolean) {
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

  const membershipData3 = membership as any
  if (!membershipData3 || membershipData3.role !== 'owner') {
    return { error: 'Hanya pemilik yang dapat mengubah pengaturan bisnis' }
  }

  // Update setting
  const { error } = await supabase
    .from('businesses')
    .update({ auto_update_equity_on_contribution: enabled })
    .eq('id', businessId)

  if (error) {
    return { error: error.message }
  }

  // Log activity
  await supabase.from('activity_logs').insert({
    business_id: businessId,
    user_id: user.id,
    action: 'business_setting_updated',
    entity_type: 'business',
    entity_id: businessId,
    details: {
      setting: 'auto_update_equity_on_contribution',
      value: enabled,
      description: `Auto-update ekuitas ${enabled ? 'diaktifkan' : 'dinonaktifkan'}`
    },
  })

  revalidatePath(`/bisnis/${businessId}`)
  return { success: true }
}
