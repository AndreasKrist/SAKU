-- =====================================================
-- COMPREHENSIVE FIX FOR BUSINESS CREATION RLS ERROR
-- This fixes: "new row violates row-level security policy for table businesses"
-- =====================================================

-- Step 1: Check current policies on businesses table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'businesses';

-- =====================================================
-- Step 2: DROP ALL EXISTING POLICIES ON BUSINESSES TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view businesses they're members of" ON businesses;
DROP POLICY IF EXISTS "Users can create businesses" ON businesses;
DROP POLICY IF EXISTS "Owners can update business details" ON businesses;
DROP POLICY IF EXISTS "Owners can delete businesses" ON businesses;

-- =====================================================
-- Step 3: RECREATE ALL POLICIES CORRECTLY
-- =====================================================

-- SELECT: Users can view businesses they're members of
CREATE POLICY "Users can view businesses they're members of"
  ON businesses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_members.business_id = businesses.id
      AND business_members.user_id = auth.uid()
    )
  );

-- INSERT: Authenticated users can create businesses
-- CRITICAL: This must use TO authenticated and only check created_by
CREATE POLICY "Users can create businesses"
  ON businesses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- UPDATE: Only business owners can update business details
CREATE POLICY "Owners can update business details"
  ON businesses FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_members.business_id = businesses.id
      AND business_members.user_id = auth.uid()
      AND business_members.role = 'owner'
    )
  );

-- DELETE: Only business owners can delete businesses
CREATE POLICY "Owners can delete businesses"
  ON businesses FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_members.business_id = businesses.id
      AND business_members.user_id = auth.uid()
      AND business_members.role = 'owner'
    )
  );

-- =====================================================
-- Step 4: VERIFY THE FIX
-- =====================================================

-- Check that policies were created correctly
SELECT
  policyname,
  cmd,
  roles,
  with_check IS NOT NULL as has_with_check,
  qual IS NOT NULL as has_qual
FROM pg_policies
WHERE tablename = 'businesses'
ORDER BY cmd;

-- =====================================================
-- Step 5: TEST AUTHENTICATION
-- =====================================================

-- This should return your user ID if you're logged in
SELECT auth.uid() as current_user_id;

-- If the above returns NULL, you're not authenticated!
