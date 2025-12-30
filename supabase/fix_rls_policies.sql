-- Fix Infinite Recursion in RLS Policies for SAKU
-- Run this in Supabase SQL Editor

-- =====================================================
-- DROP PROBLEMATIC POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view members of their businesses" ON business_members;
DROP POLICY IF EXISTS "Owners can add members" ON business_members;
DROP POLICY IF EXISTS "Owners can update members" ON business_members;
DROP POLICY IF EXISTS "Owners can remove members" ON business_members;

-- =====================================================
-- CREATE SECURITY DEFINER HELPER FUNCTIONS (NO RLS CHECK)
-- =====================================================

-- Drop existing functions first
DROP FUNCTION IF EXISTS is_business_member(UUID);
DROP FUNCTION IF EXISTS is_business_owner(UUID);

-- Function to check if user is business member (SECURITY DEFINER bypasses RLS)
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

-- Function to check if user is business owner (SECURITY DEFINER bypasses RLS)
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
-- RECREATE BUSINESS_MEMBERS POLICIES (NO INFINITE RECURSION)
-- =====================================================

-- Users can view members of businesses they're part of
-- Using helper function to avoid recursion
CREATE POLICY "Users can view members of their businesses"
  ON business_members FOR SELECT
  USING (is_business_member(business_id));

-- Owners can add members to their businesses
-- Using helper function to avoid recursion
CREATE POLICY "Owners can add members"
  ON business_members FOR INSERT
  WITH CHECK (is_business_owner(business_id));

-- Owners can update member details (like equity percentage)
-- Using helper function to avoid recursion
CREATE POLICY "Owners can update members"
  ON business_members FOR UPDATE
  USING (is_business_owner(business_id));

-- Owners can remove members
-- Using helper function to avoid recursion
CREATE POLICY "Owners can remove members"
  ON business_members FOR DELETE
  USING (is_business_owner(business_id) AND user_id != auth.uid());

-- =====================================================
-- VERIFY POLICIES
-- =====================================================

-- Check all policies on business_members table
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename = 'business_members';
