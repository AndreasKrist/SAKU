'use server'

import { createClient } from '@/lib/supabase/server'
import {
  calculateProfitLoss,
  calculateCashFlow,
  getPartnerCapitalAccounts,
} from '@/lib/supabase/queries'

export async function generateProfitLossReport(
  businessId: string,
  periodStart: string,
  periodEnd: string
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

  try {
    const report = await calculateProfitLoss(businessId, periodStart, periodEnd)
    return { success: true, report }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function generateCashFlowReport(
  businessId: string,
  periodStart: string,
  periodEnd: string,
  options?: { showAllExpenses?: boolean }
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

  try {
    const report = await calculateCashFlow(businessId, periodStart, periodEnd, options)
    return { success: true, report }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function generateCapitalAccountsReport(businessId: string) {
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

  try {
    const accounts = await getPartnerCapitalAccounts(businessId)
    const totalCapital = accounts.reduce((sum, acc) => sum + acc.current_balance, 0)

    return {
      success: true,
      report: {
        period_end: new Date().toISOString().split('T')[0],
        accounts,
        total_capital: totalCapital,
      },
    }
  } catch (error: any) {
    return { error: error.message }
  }
}
