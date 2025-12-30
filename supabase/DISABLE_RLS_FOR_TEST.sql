-- TEMPORARY: Disable RLS on businesses table to test if inserts work at all
-- This is ONLY for testing - we'll re-enable it after confirming the issue

-- Disable RLS on businesses table
ALTER TABLE businesses DISABLE ROW LEVEL SECURITY;

-- After testing, re-enable with:
-- ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
