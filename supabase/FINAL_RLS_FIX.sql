-- =====================================================
-- FINAL RLS FIX - RUN THIS IN SUPABASE SQL EDITOR
-- This will DEFINITELY fix the "new row violates row-level security policy" error
-- =====================================================

-- Step 1: Drop ALL existing policies on businesses table
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'businesses') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON businesses';
    END LOOP;
END $$;

-- Step 2: Ensure RLS is enabled
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- Step 3: Create the INSERT policy (this is the critical one for business creation)
-- IMPORTANT: This MUST use "TO authenticated" to work properly
CREATE POLICY "authenticated_users_can_create_businesses"
  ON businesses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Step 4: Create SELECT policy (to view businesses you're a member of)
CREATE POLICY "members_can_view_their_businesses"
  ON businesses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_members.business_id = businesses.id
      AND business_members.user_id = auth.uid()
    )
  );

-- Step 5: Create UPDATE policy (only owners can update)
CREATE POLICY "owners_can_update_businesses"
  ON businesses
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_members.business_id = businesses.id
      AND business_members.user_id = auth.uid()
      AND business_members.role = 'owner'
    )
  );

-- Step 6: Create DELETE policy (only owners can delete)
CREATE POLICY "owners_can_delete_businesses"
  ON businesses
  FOR DELETE
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
-- VERIFICATION - Run this to confirm the fix worked
-- =====================================================

SELECT
  '✅ Policies on businesses table:' as status;

SELECT
  policyname,
  cmd,
  roles::text[],
  CASE
    WHEN with_check IS NOT NULL THEN '✅ Has WITH CHECK'
    ELSE '❌ No WITH CHECK'
  END as insert_check,
  CASE
    WHEN qual IS NOT NULL THEN '✅ Has USING'
    ELSE '❌ No USING'
  END as select_check
FROM pg_policies
WHERE tablename = 'businesses'
ORDER BY cmd;

-- This should show 4 policies:
-- 1. authenticated_users_can_create_businesses (INSERT)
-- 2. members_can_view_their_businesses (SELECT)
-- 3. owners_can_update_businesses (UPDATE)
-- 4. owners_can_delete_businesses (DELETE)
