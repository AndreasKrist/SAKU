import { Database } from './database'

// Helper types for tables
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Business = Database['public']['Tables']['businesses']['Row']
export type BusinessMember = Database['public']['Tables']['business_members']['Row']
export type TransactionCategory = Database['public']['Tables']['transaction_categories']['Row']
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type CapitalContribution = Database['public']['Tables']['capital_contributions']['Row']
export type ProfitDistribution = Database['public']['Tables']['profit_distributions']['Row']
export type ProfitAllocation = Database['public']['Tables']['profit_allocations']['Row']
export type Withdrawal = Database['public']['Tables']['withdrawals']['Row']
export type ActivityLog = Database['public']['Tables']['activity_logs']['Row']

// Insert types
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type BusinessInsert = Database['public']['Tables']['businesses']['Insert']
export type BusinessMemberInsert = Database['public']['Tables']['business_members']['Insert']
export type TransactionInsert = Database['public']['Tables']['transactions']['Insert']
export type CapitalContributionInsert = Database['public']['Tables']['capital_contributions']['Insert']
export type ProfitDistributionInsert = Database['public']['Tables']['profit_distributions']['Insert']
export type ProfitAllocationInsert = Database['public']['Tables']['profit_allocations']['Insert']
export type WithdrawalInsert = Database['public']['Tables']['withdrawals']['Insert']
export type ActivityLogInsert = Database['public']['Tables']['activity_logs']['Insert']

// Update types
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
export type BusinessUpdate = Database['public']['Tables']['businesses']['Update']
export type BusinessMemberUpdate = Database['public']['Tables']['business_members']['Update']
export type TransactionUpdate = Database['public']['Tables']['transactions']['Update']

// Extended types with joins
export type TransactionWithCategory = Transaction & {
  category: TransactionCategory | null
  created_by_profile: Profile | null
  paid_by_profile: Profile | null
}

export type BusinessMemberWithProfile = BusinessMember & {
  profile: Profile
}

export type BusinessWithMembers = Business & {
  members: BusinessMemberWithProfile[]
}

export type CapitalContributionWithProfile = CapitalContribution & {
  profile: Profile
}

export type WithdrawalWithProfile = Withdrawal & {
  profile: Profile
}

export type ActivityLogWithUser = ActivityLog & {
  user: Profile | null
}

export type ProfitDistributionWithAllocations = ProfitDistribution & {
  allocations: (ProfitAllocation & { profile: Profile })[]
}

// Partner capital account summary
export interface PartnerCapitalAccount {
  user_id: string
  user_name: string
  equity_percentage: number
  total_contributions: number
  total_profit_allocated: number
  total_withdrawals: number
  current_balance: number
}

// Financial report types
export interface ProfitLossReport {
  period_start: string
  period_end: string
  revenue_by_category: {
    category_id: string
    category_name: string
    amount: number
  }[]
  expense_by_category: {
    category_id: string
    category_name: string
    amount: number
  }[]
  total_revenue: number
  total_expense: number
  net_profit: number
}

export interface CashFlowReport {
  period_start: string
  period_end: string
  opening_balance: number
  cash_in: number
  cash_out: number
  cash_out_business: number
  cash_out_partner: number
  closing_balance: number
  revenue_items: Transaction[]
  expense_items: Transaction[]
  show_all_expenses: boolean
  // Financing activities
  contributions_in: number
  withdrawals_out: number
  contribution_items: any[]
  withdrawal_items: any[]
}

export interface CapitalAccountsReport {
  period_end: string
  accounts: PartnerCapitalAccount[]
  total_capital: number
}

// Form types
export interface TransactionFormData {
  category_id?: string
  amount: number
  type: 'revenue' | 'expense'
  payment_source: string // 'business' or user_id
  paid_by_user_id?: string | null
  item_name?: string
  quantity?: number
  quantity_unit?: string
  notes?: string
  transaction_date: string
}

export interface BusinessFormData {
  name: string
  description?: string
  start_date: string
}

export interface CapitalContributionFormData {
  user_id: string
  amount: number
  type: 'initial' | 'additional'
  notes?: string
  contribution_date: string
}

export interface WithdrawalFormData {
  amount: number
  notes?: string
  withdrawal_date: string
}

export interface ProfitDistributionFormData {
  period_start: string
  period_end: string
  distribution_percentage: number
}

// Utility type for select options
export interface SelectOption<T = string> {
  value: T
  label: string
}

// Quantity units
export const QUANTITY_UNITS: SelectOption[] = [
  { value: 'pcs', label: 'Pcs' },
  { value: 'box', label: 'Box' },
  { value: 'kg', label: 'Kg' },
  { value: 'gram', label: 'Gram' },
  { value: 'liter', label: 'Liter' },
  { value: 'ml', label: 'ML' },
  { value: 'meter', label: 'Meter' },
  { value: 'set', label: 'Set' },
  { value: 'lusin', label: 'Lusin' },
  { value: 'kodi', label: 'Kodi' },
]
