-- Check businesses table policies
SELECT
  policyname,
  cmd,
  with_check,
  qual
FROM pg_policies
WHERE tablename = 'businesses'
ORDER BY cmd;
