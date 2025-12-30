-- Drop all old foreign keys that point to auth.users
-- Keep only the new ones that point to profiles
-- Note: profiles.id should still point to auth.users (that one is correct)

-- 1. businesses.created_by
ALTER TABLE businesses
DROP CONSTRAINT IF EXISTS businesses_created_by_fkey;

-- Keep: profiles.id → auth.users (this is correct)

-- 2. business_members.user_id (keep the profiles one, drop the auth.users one)
ALTER TABLE business_members
DROP CONSTRAINT IF EXISTS business_members_user_id_fkey;

-- 3. capital_contributions.user_id
ALTER TABLE capital_contributions
DROP CONSTRAINT IF EXISTS capital_contributions_user_id_fkey;

-- 4. profit_distributions.created_by
ALTER TABLE profit_distributions
DROP CONSTRAINT IF EXISTS profit_distributions_created_by_fkey;

-- 5. profit_allocations.user_id
ALTER TABLE profit_allocations
DROP CONSTRAINT IF EXISTS profit_allocations_user_id_fkey;

-- 6. withdrawals.created_by
ALTER TABLE withdrawals
DROP CONSTRAINT IF EXISTS withdrawals_created_by_fkey;

-- 7. withdrawals.user_id
ALTER TABLE withdrawals
DROP CONSTRAINT IF EXISTS withdrawals_user_id_fkey;

-- 8. activity_logs.user_id
ALTER TABLE activity_logs
DROP CONSTRAINT IF EXISTS activity_logs_user_id_fkey;

-- Now add the missing foreign keys to profiles where needed

-- businesses.created_by → profiles
ALTER TABLE businesses
ADD CONSTRAINT businesses_created_by_fkey
FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE;

-- profit_distributions.created_by → profiles
ALTER TABLE profit_distributions
ADD CONSTRAINT profit_distributions_created_by_fkey
FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- withdrawals.created_by → profiles
ALTER TABLE withdrawals
ADD CONSTRAINT withdrawals_created_by_fkey
FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;
