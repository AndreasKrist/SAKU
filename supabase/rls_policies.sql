-- SAKU Row-Level Security (RLS) Policies
-- Sistem Aplikasi Keuangan UMKM
-- This file contains all RLS policies to secure data access

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE capital_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profit_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profit_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 1. PROFILES POLICIES
-- =====================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can view profiles of members in the same business
-- This allows users to see names of other business members
CREATE POLICY "Users can view profiles of business members"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM business_members bm1
      INNER JOIN business_members bm2 ON bm1.business_id = bm2.business_id
      WHERE bm1.user_id = auth.uid()
      AND bm2.user_id = profiles.id
    )
  );

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (handled by trigger, but allows manual insert)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- 2. BUSINESSES POLICIES
-- =====================================================

-- Users can view businesses they're members of
CREATE POLICY "Users can view businesses they're members of"
  ON businesses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_members.business_id = businesses.id
      AND business_members.user_id = auth.uid()
    )
  );

-- Users can create businesses
CREATE POLICY "Users can create businesses"
  ON businesses FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Only business owners can update business details
CREATE POLICY "Owners can update business details"
  ON businesses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_members.business_id = businesses.id
      AND business_members.user_id = auth.uid()
      AND business_members.role = 'owner'
    )
  );

-- Only business owners can delete businesses
CREATE POLICY "Owners can delete businesses"
  ON businesses FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_members.business_id = businesses.id
      AND business_members.user_id = auth.uid()
      AND business_members.role = 'owner'
    )
  );

-- =====================================================
-- 3. BUSINESS_MEMBERS POLICIES
-- =====================================================

-- Users can view members of businesses they're part of
CREATE POLICY "Users can view members of their businesses"
  ON business_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM business_members bm
      WHERE bm.business_id = business_members.business_id
      AND bm.user_id = auth.uid()
    )
  );

-- Users can join businesses (insert themselves)
CREATE POLICY "Users can join businesses"
  ON business_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Owners can add members to their businesses
CREATE POLICY "Owners can add members"
  ON business_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_members.business_id = business_members.business_id
      AND business_members.user_id = auth.uid()
      AND business_members.role = 'owner'
    )
  );

-- Owners can update member details (like equity percentage)
CREATE POLICY "Owners can update members"
  ON business_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM business_members bm
      WHERE bm.business_id = business_members.business_id
      AND bm.user_id = auth.uid()
      AND bm.role = 'owner'
    )
  );

-- Owners can remove members
CREATE POLICY "Owners can remove members"
  ON business_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM business_members bm
      WHERE bm.business_id = business_members.business_id
      AND bm.user_id = auth.uid()
      AND bm.role = 'owner'
    )
  );

-- Users can remove themselves from businesses
CREATE POLICY "Users can leave businesses"
  ON business_members FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 4. TRANSACTION_CATEGORIES POLICIES
-- =====================================================

-- All authenticated users can view categories (public reference data)
CREATE POLICY "All users can view categories"
  ON transaction_categories FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Only specific admin users can manage categories (optional, for future)
-- For now, categories are seeded and managed via migrations

-- =====================================================
-- 5. TRANSACTIONS POLICIES
-- =====================================================

-- Users can view transactions of businesses they're members of
CREATE POLICY "Users can view business transactions"
  ON transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_members.business_id = transactions.business_id
      AND business_members.user_id = auth.uid()
    )
  );

-- Users can create transactions for businesses they're members of
CREATE POLICY "Members can create transactions"
  ON transactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_members.business_id = transactions.business_id
      AND business_members.user_id = auth.uid()
    )
    AND auth.uid() = created_by
  );

-- Users can update transactions they created (within their businesses)
CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_members.business_id = transactions.business_id
      AND business_members.user_id = auth.uid()
    )
    AND auth.uid() = created_by
  );

-- Users can delete transactions they created (within their businesses)
CREATE POLICY "Users can delete own transactions"
  ON transactions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_members.business_id = transactions.business_id
      AND business_members.user_id = auth.uid()
    )
    AND auth.uid() = created_by
  );

-- =====================================================
-- 6. CAPITAL_CONTRIBUTIONS POLICIES
-- =====================================================

-- Users can view capital contributions for businesses they're members of
CREATE POLICY "Users can view business capital contributions"
  ON capital_contributions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_members.business_id = capital_contributions.business_id
      AND business_members.user_id = auth.uid()
    )
  );

-- Users can add capital contributions for businesses they're members of
CREATE POLICY "Members can add capital contributions"
  ON capital_contributions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_members.business_id = capital_contributions.business_id
      AND business_members.user_id = auth.uid()
    )
  );

-- Only the contributing user or owner can update contributions
CREATE POLICY "Users can update own contributions"
  ON capital_contributions FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM business_members
      WHERE business_members.business_id = capital_contributions.business_id
      AND business_members.user_id = auth.uid()
      AND business_members.role = 'owner'
    )
  );

-- =====================================================
-- 7. PROFIT_DISTRIBUTIONS POLICIES
-- =====================================================

-- Users can view profit distributions for businesses they're members of
CREATE POLICY "Users can view business profit distributions"
  ON profit_distributions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_members.business_id = profit_distributions.business_id
      AND business_members.user_id = auth.uid()
    )
  );

-- Only owners can create profit distributions
CREATE POLICY "Owners can create profit distributions"
  ON profit_distributions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_members.business_id = profit_distributions.business_id
      AND business_members.user_id = auth.uid()
      AND business_members.role = 'owner'
    )
    AND auth.uid() = created_by
  );

-- Only owners can update profit distributions
CREATE POLICY "Owners can update profit distributions"
  ON profit_distributions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_members.business_id = profit_distributions.business_id
      AND business_members.user_id = auth.uid()
      AND business_members.role = 'owner'
    )
  );

-- =====================================================
-- 8. PROFIT_ALLOCATIONS POLICIES
-- =====================================================

-- Users can view profit allocations for businesses they're members of
CREATE POLICY "Users can view profit allocations"
  ON profit_allocations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profit_distributions pd
      JOIN business_members bm ON bm.business_id = pd.business_id
      WHERE pd.id = profit_allocations.distribution_id
      AND bm.user_id = auth.uid()
    )
  );

-- Only owners can create profit allocations
CREATE POLICY "Owners can create profit allocations"
  ON profit_allocations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profit_distributions pd
      JOIN business_members bm ON bm.business_id = pd.business_id
      WHERE pd.id = profit_allocations.distribution_id
      AND bm.user_id = auth.uid()
      AND bm.role = 'owner'
    )
  );

-- =====================================================
-- 9. WITHDRAWALS POLICIES
-- =====================================================

-- Users can view withdrawals for businesses they're members of
CREATE POLICY "Users can view business withdrawals"
  ON withdrawals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_members.business_id = withdrawals.business_id
      AND business_members.user_id = auth.uid()
    )
  );

-- Users can create withdrawals for themselves in businesses they're members of
CREATE POLICY "Members can create own withdrawals"
  ON withdrawals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_members.business_id = withdrawals.business_id
      AND business_members.user_id = auth.uid()
    )
    AND auth.uid() = user_id
  );

-- Users can update their own withdrawals
CREATE POLICY "Users can update own withdrawals"
  ON withdrawals FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own withdrawals
CREATE POLICY "Users can delete own withdrawals"
  ON withdrawals FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 10. ACTIVITY_LOGS POLICIES
-- =====================================================

-- Users can view activity logs for businesses they're members of
CREATE POLICY "Users can view business activity logs"
  ON activity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_members.business_id = activity_logs.business_id
      AND business_members.user_id = auth.uid()
    )
  );

-- System can insert activity logs (created by triggers or application logic)
CREATE POLICY "System can create activity logs"
  ON activity_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_members.business_id = activity_logs.business_id
      AND business_members.user_id = auth.uid()
    )
  );

-- =====================================================
-- HELPER FUNCTIONS FOR RLS
-- =====================================================

-- Function to check if user is business member
CREATE OR REPLACE FUNCTION is_business_member(business_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM business_members
    WHERE business_id = business_uuid
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is business owner
CREATE OR REPLACE FUNCTION is_business_owner(business_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM business_members
    WHERE business_id = business_uuid
    AND user_id = auth.uid()
    AND role = 'owner'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON POLICY "Users can view own profile" ON profiles IS
  'Users can only view their own profile data';

COMMENT ON POLICY "Users can view businesses they're members of" ON businesses IS
  'Users can only view businesses where they are registered as members';

COMMENT ON POLICY "Users can view business transactions" ON transactions IS
  'Users can view all transactions for businesses they are members of (full transparency)';

COMMENT ON POLICY "Members can create transactions" ON transactions IS
  'Any business member can create transactions, supporting collaborative financial management';
