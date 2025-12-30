-- Fix: Allow users to view profiles of other members in the same business
-- This fixes the "Unknown User" issue where users can't see names of other business members

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- Create new policies:
-- 1. Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- 2. Users can view profiles of members in the same business
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

-- This allows users to see the full_name, email, and other profile data
-- of other users who are members of the same business
