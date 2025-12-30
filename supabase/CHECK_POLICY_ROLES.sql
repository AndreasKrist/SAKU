-- Check if policies apply to authenticated users
SELECT
  policyname,
  cmd,
  roles::text[] as applies_to_roles,
  permissive
FROM pg_policies
WHERE tablename = 'businesses'
AND cmd = 'INSERT';
