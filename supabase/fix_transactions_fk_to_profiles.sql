-- Fix transactions foreign keys to point to profiles instead of auth.users
-- This allows Supabase PostgREST to join transactions with profiles

-- 1. Drop existing foreign keys that point to auth.users
ALTER TABLE transactions
DROP CONSTRAINT IF EXISTS transactions_created_by_fkey;

ALTER TABLE transactions
DROP CONSTRAINT IF EXISTS transactions_paid_by_user_id_fkey;

-- 2. Add new foreign keys pointing to profiles
ALTER TABLE transactions
ADD CONSTRAINT transactions_created_by_fkey
FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE transactions
ADD CONSTRAINT transactions_paid_by_user_id_fkey
FOREIGN KEY (paid_by_user_id) REFERENCES profiles(id) ON DELETE SET NULL;
