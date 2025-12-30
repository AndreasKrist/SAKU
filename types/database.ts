export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      businesses: {
        Row: {
          id: string
          name: string
          description: string | null
          business_code: string
          invite_link: string
          start_date: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          business_code: string
          invite_link: string
          start_date?: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          business_code?: string
          invite_link?: string
          start_date?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      business_members: {
        Row: {
          id: string
          business_id: string
          user_id: string
          role: 'owner' | 'member'
          equity_percentage: number
          joined_at: string
        }
        Insert: {
          id?: string
          business_id: string
          user_id: string
          role?: 'owner' | 'member'
          equity_percentage?: number
          joined_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          user_id?: string
          role?: 'owner' | 'member'
          equity_percentage?: number
          joined_at?: string
        }
      }
      transaction_categories: {
        Row: {
          id: string
          name: string
          type: 'revenue' | 'expense'
          has_item_field: boolean
          display_order: number | null
          is_active: boolean
        }
        Insert: {
          id?: string
          name: string
          type: 'revenue' | 'expense'
          has_item_field?: boolean
          display_order?: number | null
          is_active?: boolean
        }
        Update: {
          id?: string
          name?: string
          type?: 'revenue' | 'expense'
          has_item_field?: boolean
          display_order?: number | null
          is_active?: boolean
        }
      }
      transactions: {
        Row: {
          id: string
          business_id: string
          category_id: string | null
          amount: number
          type: 'revenue' | 'expense'
          payment_source: string
          paid_by_user_id: string | null
          item_name: string | null
          quantity: number | null
          quantity_unit: string | null
          notes: string | null
          transaction_date: string
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          category_id?: string | null
          amount: number
          type: 'revenue' | 'expense'
          payment_source: string
          paid_by_user_id?: string | null
          item_name?: string | null
          quantity?: number | null
          quantity_unit?: string | null
          notes?: string | null
          transaction_date: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          category_id?: string | null
          amount?: number
          type?: 'revenue' | 'expense'
          payment_source?: string
          paid_by_user_id?: string | null
          item_name?: string | null
          quantity?: number | null
          quantity_unit?: string | null
          notes?: string | null
          transaction_date?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      capital_contributions: {
        Row: {
          id: string
          business_id: string
          user_id: string
          amount: number
          type: 'initial' | 'additional' | 'from_expense'
          source_transaction_id: string | null
          notes: string | null
          contribution_date: string
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          user_id: string
          amount: number
          type: 'initial' | 'additional' | 'from_expense'
          source_transaction_id?: string | null
          notes?: string | null
          contribution_date: string
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          user_id?: string
          amount?: number
          type?: 'initial' | 'additional' | 'from_expense'
          source_transaction_id?: string | null
          notes?: string | null
          contribution_date?: string
          created_at?: string
        }
      }
      profit_distributions: {
        Row: {
          id: string
          business_id: string
          period_start: string
          period_end: string
          total_profit: number
          distribution_percentage: number
          distributed_amount: number
          retained_amount: number
          distribution_date: string
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          period_start: string
          period_end: string
          total_profit: number
          distribution_percentage: number
          distributed_amount: number
          retained_amount: number
          distribution_date: string
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          period_start?: string
          period_end?: string
          total_profit?: number
          distribution_percentage?: number
          distributed_amount?: number
          retained_amount?: number
          distribution_date?: string
          created_by?: string | null
          created_at?: string
        }
      }
      profit_allocations: {
        Row: {
          id: string
          distribution_id: string
          user_id: string
          equity_percentage: number
          allocated_amount: number
          created_at: string
        }
        Insert: {
          id?: string
          distribution_id: string
          user_id: string
          equity_percentage: number
          allocated_amount: number
          created_at?: string
        }
        Update: {
          id?: string
          distribution_id?: string
          user_id?: string
          equity_percentage?: number
          allocated_amount?: number
          created_at?: string
        }
      }
      withdrawals: {
        Row: {
          id: string
          business_id: string
          user_id: string
          amount: number
          withdrawal_date: string
          notes: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          user_id: string
          amount: number
          withdrawal_date: string
          notes?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          user_id?: string
          amount?: number
          withdrawal_date?: string
          notes?: string | null
          created_by?: string | null
          created_at?: string
        }
      }
      activity_logs: {
        Row: {
          id: string
          business_id: string
          user_id: string | null
          action: string
          entity_type: string | null
          entity_id: string | null
          details: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          user_id?: string | null
          action: string
          entity_type?: string | null
          entity_id?: string | null
          details?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          user_id?: string | null
          action?: string
          entity_type?: string | null
          entity_id?: string | null
          details?: Json | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_business_member: {
        Args: { business_uuid: string }
        Returns: boolean
      }
      is_business_owner: {
        Args: { business_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
