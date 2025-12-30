# SAKU Database Setup

This folder contains all SQL files needed to set up the SAKU database in Supabase.

## Files

1. **schema.sql** - Complete database schema with all tables, indexes, triggers, and functions
2. **rls_policies.sql** - Row-Level Security policies for secure data access
3. **seed_data.sql** - Initial data for transaction categories

## Setup Instructions

### Option 1: Using Supabase Dashboard (Recommended for first setup)

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the files in this order:
   - First: `schema.sql`
   - Second: `rls_policies.sql`
   - Third: `seed_data.sql`

### Option 2: Using Supabase CLI

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

## Database Schema Overview

### Core Tables

1. **profiles** - User profiles extending Supabase auth.users
2. **businesses** - Business entities with invitation codes
3. **business_members** - Partnership relationships with equity %
4. **transaction_categories** - Predefined revenue/expense categories
5. **transactions** - All financial transactions with payment source tracking
6. **capital_contributions** - Partner capital contributions
7. **profit_distributions** - Periodic profit distribution records
8. **profit_allocations** - Individual partner profit shares
9. **withdrawals** - Partner withdrawals from capital
10. **activity_logs** - Audit trail for transparency

### Key Features

- **Automatic profile creation** when users sign up
- **Payment source tracking** - tracks whether expenses are paid by business or individual partners
- **Equity-based profit distribution** - automatically calculates profit shares
- **Full transparency** - all partners can see all transactions
- **Secure RLS policies** - users can only access businesses they're members of

## Important Notes

1. **UUID Extension**: The schema requires `uuid-ossp` extension (auto-enabled)
2. **Row-Level Security**: All tables have RLS enabled for security
3. **Triggers**: Auto-updating timestamps and profile creation
4. **Indexes**: Optimized for common queries on dates, business_id, user_id

## Environment Variables

After setting up the database, add these to your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Verification

After running all SQL files, verify the setup:

```sql
-- Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Check transaction categories
SELECT name, type, has_item_field
FROM transaction_categories
ORDER BY display_order;
```

Expected: 10 tables, all with rowsecurity = true, 14 transaction categories
