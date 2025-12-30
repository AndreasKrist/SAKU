-- SAKU Database Schema
-- Sistem Aplikasi Keuangan UMKM
-- This file contains all table definitions for the SAKU application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. PROFILES TABLE (extends Supabase auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. BUSINESSES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  business_code TEXT UNIQUE NOT NULL, -- Format: BIZ-XXXXXX
  invite_link TEXT NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast business code lookups
CREATE INDEX IF NOT EXISTS idx_business_code ON businesses(business_code);

-- =====================================================
-- 3. BUSINESS_MEMBERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS business_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  equity_percentage DECIMAL(5,2) DEFAULT 0 CHECK (equity_percentage >= 0 AND equity_percentage <= 100),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_members_business ON business_members(business_id);
CREATE INDEX IF NOT EXISTS idx_business_members_user ON business_members(user_id);

-- =====================================================
-- 4. TRANSACTION_CATEGORIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS transaction_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('revenue', 'expense')),
  has_item_field BOOLEAN DEFAULT FALSE, -- Show item/quantity fields?
  display_order INTEGER,
  is_active BOOLEAN DEFAULT TRUE
);

-- =====================================================
-- 5. TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES transaction_categories(id),
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  type TEXT NOT NULL CHECK (type IN ('revenue', 'expense')),

  -- Payment source tracking (UNIQUE FEATURE)
  payment_source TEXT NOT NULL, -- 'business' or user_id (UUID)
  paid_by_user_id UUID REFERENCES auth.users(id), -- NULL if business, UUID if partner

  -- Item tracking (conditional based on category)
  item_name TEXT,
  quantity DECIMAL(10,2),
  quantity_unit TEXT, -- 'pcs', 'box', 'kg', 'liter', etc.

  notes TEXT,
  transaction_date DATE NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_business ON transactions(business_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_paid_by ON transactions(paid_by_user_id);

-- =====================================================
-- 6. CAPITAL_CONTRIBUTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS capital_contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  type TEXT NOT NULL CHECK (type IN ('initial', 'additional', 'from_expense')),
  source_transaction_id UUID REFERENCES transactions(id), -- If from expense
  notes TEXT,
  contribution_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_capital_business_user ON capital_contributions(business_id, user_id);
CREATE INDEX IF NOT EXISTS idx_capital_date ON capital_contributions(contribution_date DESC);

-- =====================================================
-- 7. PROFIT_DISTRIBUTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS profit_distributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_profit DECIMAL(15,2) NOT NULL,
  distribution_percentage DECIMAL(5,2) NOT NULL CHECK (distribution_percentage >= 0 AND distribution_percentage <= 100),
  distributed_amount DECIMAL(15,2) NOT NULL CHECK (distributed_amount >= 0),
  retained_amount DECIMAL(15,2) NOT NULL CHECK (retained_amount >= 0),
  distribution_date DATE NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_profit_dist_business ON profit_distributions(business_id);
CREATE INDEX IF NOT EXISTS idx_profit_dist_date ON profit_distributions(distribution_date DESC);

-- =====================================================
-- 8. PROFIT_ALLOCATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS profit_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  distribution_id UUID REFERENCES profit_distributions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  equity_percentage DECIMAL(5,2) NOT NULL CHECK (equity_percentage >= 0 AND equity_percentage <= 100),
  allocated_amount DECIMAL(15,2) NOT NULL CHECK (allocated_amount >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_profit_alloc_distribution ON profit_allocations(distribution_id);
CREATE INDEX IF NOT EXISTS idx_profit_alloc_user ON profit_allocations(user_id);

-- =====================================================
-- 9. WITHDRAWALS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  withdrawal_date DATE NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_withdrawals_business_user ON withdrawals(business_id, user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_date ON withdrawals(withdrawal_date DESC);

-- =====================================================
-- 10. ACTIVITY_LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL, -- 'transaction_added', 'profit_distributed', etc.
  entity_type TEXT, -- 'transaction', 'withdrawal', 'member', etc.
  entity_id UUID,
  details JSONB, -- Store additional context
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_business ON activity_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_logs(user_id);

-- =====================================================
-- TRIGGERS FOR AUTO-UPDATING TIMESTAMPS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles table
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for businesses table
CREATE TRIGGER update_businesses_updated_at
    BEFORE UPDATE ON businesses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for transactions table
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- AUTO-CREATE PROFILE ON USER SIGNUP
-- =====================================================

-- Function to create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE profiles IS 'User profiles extending Supabase auth.users';
COMMENT ON TABLE businesses IS 'Business entities with unique codes for invitation';
COMMENT ON TABLE business_members IS 'Partnership relationships with equity percentages';
COMMENT ON TABLE transaction_categories IS 'Predefined categories for revenue and expenses';
COMMENT ON TABLE transactions IS 'All financial transactions with payment source tracking';
COMMENT ON TABLE capital_contributions IS 'Partner capital contributions including from personal expenses';
COMMENT ON TABLE profit_distributions IS 'Periodic profit distribution records';
COMMENT ON TABLE profit_allocations IS 'Individual partner profit allocations';
COMMENT ON TABLE withdrawals IS 'Partner withdrawals from capital accounts';
COMMENT ON TABLE activity_logs IS 'Audit trail for all business activities';
