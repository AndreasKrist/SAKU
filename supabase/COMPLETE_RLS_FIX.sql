-- =====================================================
-- COMPLETE RLS FIX - BUSINESSES + BUSINESS_MEMBERS
-- This fixes BOTH tables to allow business creation
-- =====================================================

-- =====================================================
-- PART 1: FIX BUSINESSES TABLE
-- =====================================================

-- Drop all existing policies on businesses
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'businesses') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON businesses';
    END LOOP;
END $$;

-- Ensure RLS is enabled
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- Create INSERT policy for businesses
CREATE POLICY "authenticated_users_can_create_businesses"
  ON businesses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Create SELECT policy for businesses
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

-- Create UPDATE policy for businesses
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

-- Create DELETE policy for businesses
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
-- PART 2: FIX BUSINESS_MEMBERS TABLE
-- =====================================================

-- Drop all existing policies on business_members
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'business_members') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON business_members';
    END LOOP;
END $$;

-- Ensure RLS is enabled
ALTER TABLE business_members ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view members of businesses they're part of
CREATE POLICY "members_can_view_business_members"
  ON business_members
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_members bm
      WHERE bm.business_id = business_members.business_id
      AND bm.user_id = auth.uid()
    )
  );

-- INSERT: Users can add themselves as members
-- This is CRITICAL for the initial owner creation
CREATE POLICY "users_can_add_themselves"
  ON business_members
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Only owners can update member details
CREATE POLICY "owners_can_update_members"
  ON business_members
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_members bm
      WHERE bm.business_id = business_members.business_id
      AND bm.user_id = auth.uid()
      AND bm.role = 'owner'
    )
  );

-- DELETE: Users can leave businesses (remove themselves)
CREATE POLICY "users_can_leave_businesses"
  ON business_members
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- DELETE: Owners can remove other members
CREATE POLICY "owners_can_remove_members"
  ON business_members
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_members bm
      WHERE bm.business_id = business_members.business_id
      AND bm.user_id = auth.uid()
      AND bm.role = 'owner'
    )
    AND user_id != auth.uid() -- Can't remove yourself with this policy
  );

-- =====================================================
-- VERIFICATION
-- =====================================================

SELECT '✅ BUSINESSES TABLE POLICIES:' as status;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'businesses' ORDER BY cmd;

SELECT '' as spacer;

SELECT '✅ BUSINESS_MEMBERS TABLE POLICIES:' as status;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'business_members' ORDER BY cmd;
