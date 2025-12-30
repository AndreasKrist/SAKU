-- =====================================================
-- DIAGNOSTIC: Check Current State of RLS Policies
-- Run this to see what's actually in your database
-- =====================================================

-- Check if helper functions exist
SELECT
  '=== HELPER FUNCTIONS ===' as section,
  routine_name,
  security_type,
  routine_definition
FROM information_schema.routines
WHERE routine_name IN ('is_business_member', 'is_business_owner')
AND routine_schema = 'public';

-- Check businesses table policies
SELECT
  '=== BUSINESSES TABLE POLICIES ===' as section,
  policyname,
  cmd,
  roles::text[],
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'businesses'
ORDER BY cmd;

-- Check business_members table policies
SELECT
  '=== BUSINESS_MEMBERS TABLE POLICIES ===' as section,
  policyname,
  cmd,
  roles::text[],
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'business_members'
ORDER BY cmd;

-- Test authentication
SELECT
  '=== AUTHENTICATION TEST ===' as section,
  auth.uid() as current_user_id,
  CASE WHEN auth.uid() IS NULL THEN 'NOT AUTHENTICATED' ELSE 'AUTHENTICATED' END as status;
