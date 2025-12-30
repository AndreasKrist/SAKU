-- Add all missing foreign key constraints from various tables to profiles
-- This allows Supabase PostgREST to join these tables with profiles

-- 1. business_members → profiles
ALTER TABLE business_members
ADD CONSTRAINT business_members_user_id_profiles_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 2. transactions.created_by → profiles
ALTER TABLE transactions
ADD CONSTRAINT transactions_created_by_fkey
FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- 3. transactions.paid_by_user_id → profiles
ALTER TABLE transactions
ADD CONSTRAINT transactions_paid_by_user_id_fkey
FOREIGN KEY (paid_by_user_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- 4. capital_contributions.user_id → profiles
ALTER TABLE capital_contributions
ADD CONSTRAINT capital_contributions_user_id_profiles_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 5. withdrawals.user_id → profiles
ALTER TABLE withdrawals
ADD CONSTRAINT withdrawals_user_id_profiles_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 6. profit_allocations.user_id → profiles
ALTER TABLE profit_allocations
ADD CONSTRAINT profit_allocations_user_id_profiles_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 7. activity_logs.user_id → profiles
ALTER TABLE activity_logs
ADD CONSTRAINT activity_logs_user_id_profiles_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;
