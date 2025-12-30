-- Add missing foreign key constraints safely (only if they don't exist)

-- 1. transactions.created_by → profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'transactions_created_by_fkey'
  ) THEN
    ALTER TABLE transactions
    ADD CONSTRAINT transactions_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 2. transactions.paid_by_user_id → profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'transactions_paid_by_user_id_fkey'
  ) THEN
    ALTER TABLE transactions
    ADD CONSTRAINT transactions_paid_by_user_id_fkey
    FOREIGN KEY (paid_by_user_id) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3. capital_contributions.user_id → profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'capital_contributions_user_id_profiles_fkey'
  ) THEN
    ALTER TABLE capital_contributions
    ADD CONSTRAINT capital_contributions_user_id_profiles_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 4. withdrawals.user_id → profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'withdrawals_user_id_profiles_fkey'
  ) THEN
    ALTER TABLE withdrawals
    ADD CONSTRAINT withdrawals_user_id_profiles_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 5. profit_allocations.user_id → profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profit_allocations_user_id_profiles_fkey'
  ) THEN
    ALTER TABLE profit_allocations
    ADD CONSTRAINT profit_allocations_user_id_profiles_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 6. activity_logs.user_id → profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'activity_logs_user_id_profiles_fkey'
  ) THEN
    ALTER TABLE activity_logs
    ADD CONSTRAINT activity_logs_user_id_profiles_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;
