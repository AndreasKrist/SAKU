-- Fix RLS Policy for Business Creation
-- This fixes the "new row violates row-level security policy" error

-- =====================================================
-- DROP AND RECREATE BUSINESS INSERT POLICY
-- =====================================================

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can create businesses" ON businesses;

-- Create a new policy that properly allows authenticated users to create businesses
CREATE POLICY "Users can create businesses"
  ON businesses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- =====================================================
-- VERIFY THE POLICY
-- =====================================================

-- Check all policies on businesses table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'businesses';
