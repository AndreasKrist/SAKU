# SAKU - Quick Setup Guide

Follow these steps to get SAKU up and running.

## ✅ Completed

- [x] Next.js 14+ project setup
- [x] TypeScript configuration
- [x] Tailwind CSS configuration
- [x] shadcn/ui setup
- [x] Supabase client configuration
- [x] Database schema SQL files
- [x] RLS policies SQL files
- [x] Seed data SQL files
- [x] TypeScript type definitions
- [x] Utility functions and hooks

## 🚀 Next Steps (Do This Now)

### Step 1: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Next.js, React, TypeScript
- Supabase client libraries
- Tailwind CSS and shadcn/ui components
- Date utilities, form libraries, etc.

### Step 2: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Name**: SAKU (or any name)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to Indonesia (Singapore recommended)
5. Wait for project to initialize (~2 minutes)

### Step 3: Set Up Database

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **"+ New Query"**
3. Copy and paste the contents of `supabase/schema.sql`
4. Click **"Run"** (bottom right)
5. Wait for success message

6. Create another new query
7. Copy and paste the contents of `supabase/rls_policies.sql`
8. Click **"Run"**

9. Create another new query
10. Copy and paste the contents of `supabase/seed_data.sql`
11. Click **"Run"**

### Step 4: Get API Credentials

1. In Supabase dashboard, go to **Settings → API**
2. Copy two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")

### Step 5: Configure Environment Variables

1. In your project root, create a file named `.env.local`
2. Add these lines (replace with your actual values):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

3. Save the file

### Step 6: Verify Database Setup

Go to Supabase dashboard → **SQL Editor** → New Query, run:

```sql
-- Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Expected: You should see 10 tables:
- activity_logs
- business_members
- businesses
- capital_contributions
- profit_allocations
- profit_distributions
- profiles
- transaction_categories
- transactions
- withdrawals

Run another query:

```sql
-- Check transaction categories
SELECT name, type, has_item_field
FROM transaction_categories
ORDER BY display_order;
```

Expected: You should see 14 categories (3 revenue, 11 expense)

### Step 7: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

You should see the SAKU homepage!

## 🎯 What's Next?

Now you're ready to implement the features. Start with:

### Phase 1A: Authentication (Priority 1)
Build the authentication flow first:
- Sign up page
- Login page
- Logout functionality
- Protected routes with middleware

### Phase 1B: Business Setup (Priority 2)
- Create business flow
- Generate business code
- Invite members via code
- Set equity percentages

### Phase 1C: Core Features (Priority 3)
- Transaction recording
- Dashboard
- Basic reports

## 📋 Development Checklist

- [ ] Install dependencies
- [ ] Create Supabase project
- [ ] Run schema.sql
- [ ] Run rls_policies.sql
- [ ] Run seed_data.sql
- [ ] Configure .env.local
- [ ] Verify database setup
- [ ] Run `npm run dev`
- [ ] See SAKU homepage

## 🆘 Troubleshooting

### "Cannot find module '@supabase/ssr'"
Run: `npm install`

### "Invalid API key"
Check your `.env.local` file has correct values from Supabase dashboard

### "Relation does not exist" error
Make sure you ran all three SQL files in order

### Database setup issues
See detailed instructions in `supabase/README.md`

## 🔧 Useful Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Check types
npx tsc --noEmit
```

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)

---

**Current Status**: Foundation complete, ready for feature development!

**Next Action**: Run `npm install` then create your Supabase project.
