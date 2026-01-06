import { cache } from 'react'
import { createClient } from './server'
import type {
  Business,
  BusinessMember,
  Transaction,
  TransactionCategory,
  CapitalContribution,
  ProfitDistribution,
  Withdrawal,
  ActivityLog,
  PartnerCapitalAccount,
} from '@/types'

// =====================================================
// BUSINESS QUERIES
// =====================================================

// Cache getUserBusinesses for the request duration
export const getUserBusinesses = cache(async (userId: string) => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('business_members')
    .select(`
      *,
      business:businesses(*)
    `)
    .eq('user_id', userId)

  if (error) throw error
  return data
})

// Cache getBusinessById for request duration
export const getBusinessById = cache(async (businessId: string) => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', businessId)
    .single()

  if (error) throw error
  return data
})

// Cache getBusinessMembers for request duration
// Members change more frequently so use React cache only
export const getBusinessMembers = cache(async (businessId: string) => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('business_members')
    .select(`
      *,
      profile:profiles(*)
    `)
    .eq('business_id', businessId)
    .order('equity_percentage', { ascending: false })

  if (error) throw error
  return data
})

// =====================================================
// TRANSACTION QUERIES
// =====================================================

export async function getTransactionCategories() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('transaction_categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order')

  if (error) throw error
  return data
}

export async function getBusinessTransactions(
  businessId: string,
  options?: {
    startDate?: string
    endDate?: string
    type?: 'revenue' | 'expense'
    categoryId?: string
  }
) {
  const supabase = await createClient()

  let query = supabase
    .from('transactions')
    .select(`
      *,
      category:transaction_categories(*),
      created_by_profile:profiles!transactions_created_by_fkey(*),
      paid_by_profile:profiles!transactions_paid_by_user_id_fkey(*)
    `)
    .eq('business_id', businessId)

  if (options?.startDate) {
    query = query.gte('transaction_date', options.startDate)
  }

  if (options?.endDate) {
    query = query.lte('transaction_date', options.endDate)
  }

  if (options?.type) {
    query = query.eq('type', options.type)
  }

  if (options?.categoryId) {
    query = query.eq('category_id', options.categoryId)
  }

  const { data, error } = await query.order('transaction_date', { ascending: false })

  if (error) throw error
  return data
}

// =====================================================
// CAPITAL CONTRIBUTION QUERIES
// =====================================================

export async function getCapitalContributions(
  businessId: string,
  userId?: string
) {
  const supabase = await createClient()

  let query = supabase
    .from('capital_contributions')
    .select(`
      *,
      profile:profiles(*)
    `)
    .eq('business_id', businessId)

  if (userId) {
    query = query.eq('user_id', userId)
  }

  const { data, error } = await query.order('contribution_date', { ascending: false })

  if (error) throw error
  return data
}

// =====================================================
// PARTNER CAPITAL ACCOUNT CALCULATION
// =====================================================

// Cache capital accounts for request duration
// Calculates profit share from transactions directly (not from profit_allocations)
export const getPartnerCapitalAccounts = cache(
  async (businessId: string): Promise<PartnerCapitalAccount[]> => {
    const supabase = await createClient()

    // Get members
    const { data: members, error: membersError } = await supabase
      .from('business_members')
      .select('*, profile:profiles(*)')
      .eq('business_id', businessId)

    if (membersError) throw membersError

    // Get all capital contributions
    const { data: contributions, error: contributionsError } = await supabase
      .from('capital_contributions')
      .select('user_id, amount')
      .eq('business_id', businessId)

    if (contributionsError) throw contributionsError

    // Get all transactions to calculate total profit
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('type, amount')
      .eq('business_id', businessId)

    if (transactionsError) throw transactionsError

    // Calculate total profit from transactions
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

    // Get all withdrawals
    const { data: withdrawals, error: withdrawalsError } = await supabase
      .from('withdrawals')
      .select('user_id, amount')
      .eq('business_id', businessId)

    if (withdrawalsError) throw withdrawalsError

    // Calculate for each member
    return members.map((member) => {
      const totalContributions = contributions
        .filter((c) => c.user_id === member.user_id)
        .reduce((sum, c) => sum + Number(c.amount), 0)

      // Calculate profit share based on equity percentage
      const equityPercentage = Number(member.equity_percentage)
      const totalProfitAllocated = totalBusinessProfit * (equityPercentage / 100)

      const totalWithdrawals = withdrawals
        .filter((w) => w.user_id === member.user_id)
        .reduce((sum, w) => sum + Number(w.amount), 0)

      // Current balance = ONLY profit that can be withdrawn (contributions are permanent equity)
      const withdrawableBalance = totalProfitAllocated - totalWithdrawals

      return {
        user_id: member.user_id,
        user_name: member.profile?.full_name || 'Unknown User',
        equity_percentage: equityPercentage,
        total_contributions: totalContributions,
        total_profit_allocated: totalProfitAllocated,
        total_withdrawals: totalWithdrawals,
        current_balance: withdrawableBalance,
      }
    })
  }
)

// =====================================================
// PROFIT & LOSS CALCULATION
// =====================================================

export async function calculateProfitLoss(
  businessId: string,
  periodStart: string,
  periodEnd: string
) {
  const supabase = await createClient()

  // Get all transactions in the period
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('*, category:transaction_categories(*)')
    .eq('business_id', businessId)
    .gte('transaction_date', periodStart)
    .lte('transaction_date', periodEnd)

  if (error) throw error

  // Group by category
  const revenueByCategory = new Map<string, { category_name: string; amount: number }>()
  const expenseByCategory = new Map<string, { category_name: string; amount: number }>()

  let totalRevenue = 0
  let totalExpense = 0

  transactions.forEach((t) => {
    const amount = Number(t.amount)
    const categoryId = t.category_id || 'uncategorized'
    const categoryName = t.category?.name || 'Tidak Berkategori'

    if (t.type === 'revenue') {
      totalRevenue += amount
      const existing = revenueByCategory.get(categoryId)
      revenueByCategory.set(categoryId, {
        category_name: categoryName,
        amount: (existing?.amount || 0) + amount,
      })
    } else {
      totalExpense += amount
      const existing = expenseByCategory.get(categoryId)
      expenseByCategory.set(categoryId, {
        category_name: categoryName,
        amount: (existing?.amount || 0) + amount,
      })
    }
  })

  return {
    period_start: periodStart,
    period_end: periodEnd,
    revenue_by_category: Array.from(revenueByCategory.entries()).map(
      ([category_id, data]) => ({
        category_id,
        category_name: data.category_name,
        amount: data.amount,
      })
    ),
    expense_by_category: Array.from(expenseByCategory.entries()).map(
      ([category_id, data]) => ({
        category_id,
        category_name: data.category_name,
        amount: data.amount,
      })
    ),
    total_revenue: totalRevenue,
    total_expense: totalExpense,
    net_profit: totalRevenue - totalExpense,
  }
}

// =====================================================
// CASH FLOW CALCULATION
// =====================================================

export async function calculateCashFlow(
  businessId: string,
  periodStart: string,
  periodEnd: string,
  options?: { showAllExpenses?: boolean }
) {
  const supabase = await createClient()
  const showAllExpenses = options?.showAllExpenses ?? false

  // Build query for transactions in period
  let query = supabase
    .from('transactions')
    .select('*')
    .eq('business_id', businessId)
    .gte('transaction_date', periodStart)
    .lte('transaction_date', periodEnd)
    .order('transaction_date', { ascending: true })

  // If not showing all, filter to business-only payments
  if (!showAllExpenses) {
    query = query.eq('payment_source', 'business')
  }

  const { data: transactions, error } = await query

  if (error) throw error

  // Calculate opening balance (always from business cash only - this is actual cash position)
  const { data: previousTransactions, error: prevError } = await supabase
    .from('transactions')
    .select('type, amount')
    .eq('business_id', businessId)
    .eq('payment_source', 'business')
    .lt('transaction_date', periodStart)

  if (prevError) throw prevError

  // Get previous contributions and withdrawals (before period)
  const { data: previousContributions } = await supabase
    .from('capital_contributions')
    .select('amount')
    .eq('business_id', businessId)
    .lt('contribution_date', periodStart)

  const { data: previousWithdrawals } = await supabase
    .from('withdrawals')
    .select('amount')
    .eq('business_id', businessId)
    .lt('withdrawal_date', periodStart)

  let openingBalance = 0
  previousTransactions?.forEach((t) => {
    const amount = Number(t.amount)
    openingBalance += t.type === 'revenue' ? amount : -amount
  })

  // Add contributions and withdrawals to opening balance
  previousContributions?.forEach((c) => {
    openingBalance += Number(c.amount)
  })
  previousWithdrawals?.forEach((w) => {
    openingBalance -= Number(w.amount)
  })

  // Get contributions and withdrawals in period
  const { data: contributions } = await supabase
    .from('capital_contributions')
    .select('*')
    .eq('business_id', businessId)
    .gte('contribution_date', periodStart)
    .lte('contribution_date', periodEnd)
    .order('contribution_date', { ascending: true })

  const { data: withdrawals } = await supabase
    .from('withdrawals')
    .select('*')
    .eq('business_id', businessId)
    .gte('withdrawal_date', periodStart)
    .lte('withdrawal_date', periodEnd)
    .order('withdrawal_date', { ascending: true })

  const contributionsIn = contributions?.reduce((sum, c) => sum + Number(c.amount), 0) || 0
  const withdrawalsOut = withdrawals?.reduce((sum, w) => sum + Number(w.amount), 0) || 0

  // Calculate period cash flow
  let cashIn = 0
  let cashOut = 0
  let cashOutBusiness = 0
  let cashOutPartner = 0

  transactions?.forEach((t) => {
    const amount = Number(t.amount)
    if (t.type === 'revenue') {
      cashIn += amount
    } else {
      cashOut += amount
      if (t.payment_source === 'business') {
        cashOutBusiness += amount
      } else {
        cashOutPartner += amount
      }
    }
  })

  // Closing balance = Opening + Operations + Financing
  const closingBalance = openingBalance + cashIn - cashOutBusiness + contributionsIn - withdrawalsOut

  return {
    period_start: periodStart,
    period_end: periodEnd,
    opening_balance: openingBalance,
    cash_in: cashIn,
    cash_out: cashOut,
    cash_out_business: cashOutBusiness,
    cash_out_partner: cashOutPartner,
    closing_balance: closingBalance,
    revenue_items: transactions?.filter((t) => t.type === 'revenue') || [],
    expense_items: transactions?.filter((t) => t.type === 'expense') || [],
    show_all_expenses: showAllExpenses,
    // Financing activities
    contributions_in: contributionsIn,
    withdrawals_out: withdrawalsOut,
    contribution_items: contributions || [],
    withdrawal_items: withdrawals || [],
  }
}

// =====================================================
// BUSINESS CASH CALCULATION
// =====================================================

/**
 * Calculate current business cash balance
 * Formula: Contributions + Revenue - Expense(business) - Withdrawals
 */
export async function getBusinessCash(businessId: string): Promise<number> {
  const supabase = await createClient()

  // Get all capital contributions
  const { data: contributions } = await supabase
    .from('capital_contributions')
    .select('amount')
    .eq('business_id', businessId)

  const totalContributions =
    contributions?.reduce((sum, c) => sum + Number(c.amount), 0) || 0

  // Get all transactions
  const { data: transactions } = await supabase
    .from('transactions')
    .select('type, amount, payment_source')
    .eq('business_id', businessId)

  let totalRevenue = 0
  let totalExpenseFromBusiness = 0

  transactions?.forEach((t) => {
    const amount = Number(t.amount)
    if (t.type === 'revenue') {
      totalRevenue += amount
    } else if (t.type === 'expense' && t.payment_source === 'business') {
      totalExpenseFromBusiness += amount
    }
    // Expenses paid by partners don't reduce business cash
  })

  // Get all withdrawals (withdrawals reduce business cash)
  const { data: withdrawals } = await supabase
    .from('withdrawals')
    .select('amount')
    .eq('business_id', businessId)

  const totalWithdrawals =
    withdrawals?.reduce((sum, w) => sum + Number(w.amount), 0) || 0

  // Business cash = contributions + revenue - expense(business only) - withdrawals
  const businessCash =
    totalContributions + totalRevenue - totalExpenseFromBusiness - totalWithdrawals

  return businessCash
}

// =====================================================
// ACTIVITY LOG QUERIES
// =====================================================

export async function getActivityLogs(businessId: string, limit = 50) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('activity_logs')
    .select(`
      *,
      user:profiles(*)
    `)
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}
