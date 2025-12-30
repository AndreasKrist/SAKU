-- TEMPORARY TEST: Bypass RLS to confirm it's an auth issue
-- This will allow ANY authenticated user to insert, just to test if it works

-- Drop the current INSERT policy
DROP POLICY IF EXISTS "authenticated_users_can_create_businesses" ON businesses;

-- Create a more permissive policy (TEMPORARY - FOR TESTING ONLY)
CREATE POLICY "temp_allow_all_authenticated_inserts"
  ON businesses
  FOR INSERT
  TO authenticated
  WITH CHECK (true);  -- Allow all inserts from authenticated users

-- This should work! If it does, we know the issue is auth.uid() = created_by
-- If it STILL fails, then the user isn't seen as authenticated at all
