export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
        Relationships: []
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
          auto_update_equity_on_contribution: boolean
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
          auto_update_equity_on_contribution?: boolean
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
          auto_update_equity_on_contribution?: boolean
        }
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: "business_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_members_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "transaction_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
