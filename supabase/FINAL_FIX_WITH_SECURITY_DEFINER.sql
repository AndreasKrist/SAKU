-- =====================================================
-- FINAL FIX WITH SECURITY DEFINER FUNCTIONS
-- This completely fixes the infinite recursion issue
-- =====================================================

-- =====================================================
-- STEP 1: CREATE SECURITY DEFINER HELPER FUNCTIONS
-- These functions bypass RLS to prevent infinite recursion
-- =====================================================

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS is_business_member(UUID);
DROP FUNCTION IF EXISTS is_business_owner(UUID);

-- Function to check if user is a member of a business (bypasses RLS)
CREATE OR REPLACE FUNCTION is_business_member(business_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM business_members
    WHERE business_id = business_uuid
    AND user_id = auth.uid()
  );
END;
$$;

-- Function to check if user is an owner of a business (bypasses RLS)
CREATE OR REPLACE FUNCTION is_business_owner(business_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM business_members
    WHERE business_id = business_uuid
    AND user_id = auth.uid()
    AND role = 'owner'
  );
END;
$$;

-- =====================================================
-- STEP 2: DROP ALL EXISTING POLICIES
-- =====================================================

-- Drop businesses table policies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'businesses') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON businesses';
    END LOOP;
END $$;

-- Drop business_members table policies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'business_members') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON business_members';
    END LOOP;
END $$;

-- =====================================================
-- STEP 3: ENABLE RLS
-- =====================================================

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_members ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 4: BUSINESSES TABLE POLICIES
-- =====================================================

-- INSERT: Authenticated users can create businesses
CREATE POLICY "authenticated_users_can_create_businesses"
  ON businesses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- SELECT: Users can view businesses they're members of
-- Uses helper function to avoid recursion
CREATE POLICY "members_can_view_their_businesses"
  ON businesses
  FOR SELECT
  TO authenticated
  USING (is_business_member(id));

-- UPDATE: Only owners can update businesses
-- Uses helper function to avoid recursion
CREATE POLICY "owners_can_update_businesses"
  ON businesses
  FOR UPDATE
  TO authenticated
  USING (is_business_owner(id));

-- DELETE: Only owners can delete businesses
-- Uses helper function to avoid recursion
CREATE POLICY "owners_can_delete_businesses"
  ON businesses
  FOR DELETE
  TO authenticated
  USING (is_business_owner(id));

-- =====================================================
-- STEP 5: BUSINESS_MEMBERS TABLE POLICIES
-- =====================================================

-- SELECT: Users can view members of businesses they belong to
-- Uses helper function to avoid recursion
CREATE POLICY "members_can_view_business_members"
  ON business_members
  FOR SELECT
  TO authenticated
  USING (is_business_member(business_id));

-- INSERT: Users can add themselves as members
-- This is CRITICAL for initial owner creation
CREATE POLICY "users_can_add_themselves"
  ON business_members
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Only owners can update member details
-- Uses helper function to avoid recursion
CREATE POLICY "owners_can_update_members"
  ON business_members
  FOR UPDATE
  TO authenticated
  USING (is_business_owner(business_id));

-- DELETE: Users can remove themselves
CREATE POLICY "users_can_leave_businesses"
  ON business_members
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- DELETE: Owners can remove other members
-- Uses helper function to avoid recursion
CREATE POLICY "owners_can_remove_members"
  ON business_members
  FOR DELETE
  TO authenticated
  USING (
    is_business_owner(business_id)
    AND user_id != auth.uid()
  );

-- =====================================================
-- STEP 6: GRANT EXECUTE PERMISSIONS ON FUNCTIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION is_business_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_business_owner(UUID) TO authenticated;

-- =====================================================
-- VERIFICATION
-- =====================================================

SELECT '✅ HELPER FUNCTIONS:' as status;
SELECT routine_name, security_type
FROM information_schema.routines
WHERE routine_name IN ('is_business_member', 'is_business_owner')
AND routine_schema = 'public';

SELECT '' as spacer;

SELECT '✅ BUSINESSES TABLE POLICIES:' as status;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'businesses' ORDER BY cmd;

SELECT '' as spacer;

SELECT '✅ BUSINESS_MEMBERS TABLE POLICIES:' as status;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'business_members' ORDER BY cmd;
