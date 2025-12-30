-- Add only the missing foreign key constraints from various tables to profiles
-- Skip business_members as it already exists

-- 1. transactions.created_by → profiles
ALTER TABLE transactions
ADD CONSTRAINT transactions_created_by_fkey
FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- 2. transactions.paid_by_user_id → profiles
ALTER TABLE transactions
ADD CONSTRAINT transactions_paid_by_user_id_fkey
FOREIGN KEY (paid_by_user_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- 3. capital_contributions.user_id → profiles
ALTER TABLE capital_contributions
ADD CONSTRAINT capital_contributions_user_id_profiles_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 4. withdrawals.user_id → profiles
ALTER TABLE withdrawals
ADD CONSTRAINT withdrawals_user_id_profiles_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 5. profit_allocations.user_id → profiles
ALTER TABLE profit_allocations
ADD CONSTRAINT profit_allocations_user_id_profiles_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 6. activity_logs.user_id → profiles
ALTER TABLE activity_logs
ADD CONSTRAINT activity_logs_user_id_profiles_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;
