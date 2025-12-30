# SAKU - Sistem Aplikasi Keuangan UMKM

Aplikasi manajemen keuangan untuk UMKM Indonesia dengan sistem multi-partner dan transparansi penuh.

## Fitur Utama

### 1. Payment Source Tracking (Fitur Unik)
Setiap pengeluaran mencatat apakah dibayar dari:
- **Kas Bisnis** - Uang keluar dari kas bisnis
- **Uang Pribadi Partner** - Partner bayar dari kantong sendiri → otomatis menambah modal

### 2. Manajemen Partnership
- Set persentase ekuitas per partner (harus total 100%)
- Tracking modal kontribusi (awal + tambahan + dari pengeluaran pribadi)
- Transparansi penuh - semua partner lihat semua transaksi

### 3. Distribusi Profit Otomatis
- Hitung profit secara berkala (bulanan/kuartalan)
- Distribusi berdasarkan % ekuitas
- Tracking alokasi profit ke modal masing-masing partner

### 4. Laporan Keuangan
- **Profit & Loss** - Pendapatan vs Pengeluaran per kategori
- **Cash Flow** - Arus kas bisnis (hanya transaksi dibayar bisnis)
- **Capital Accounts** - Modal masing-masing partner

### 5. Activity Logging
- Audit trail lengkap untuk transparansi
- Semua partner bisa lihat siapa melakukan apa

## Tech Stack

- **Frontend**: Next.js 14+ (App Router)
- **Backend**: Supabase (BaaS)
- **Database**: PostgreSQL (via Supabase)
- **Auth**: Supabase Auth
- **UI**: Tailwind CSS + shadcn/ui
- **Deployment**: Vercel

## Project Structure

```
saku-umkm/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── lib/                   # Utilities
│   ├── supabase/         # Supabase client & queries
│   │   ├── client.ts     # Browser client
│   │   ├── server.ts     # Server client
│   │   ├── middleware.ts # Middleware helper
│   │   ├── hooks.ts      # React hooks
│   │   └── queries.ts    # Database queries
│   └── utils.ts          # Helper functions
├── types/                 # TypeScript types
│   ├── database.ts       # Database types
│   └── index.ts          # App types
├── supabase/             # Database SQL files
│   ├── schema.sql        # Database schema
│   ├── rls_policies.sql  # Security policies
│   ├── seed_data.sql     # Initial data
│   └── README.md         # Database docs
├── middleware.ts         # Next.js middleware
└── package.json          # Dependencies
```

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor in your Supabase dashboard
3. Run the SQL files in this order:
   - `supabase/schema.sql`
   - `supabase/rls_policies.sql`
   - `supabase/seed_data.sql`

For detailed instructions, see [supabase/README.md](./supabase/README.md)

### 3. Configure Environment Variables

Create `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Get these values from:
Supabase Dashboard → Settings → API

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Next Steps - Phase 1 (MVP)

Now that the foundation is ready, you need to implement:

### Authentication Flow
- [ ] Sign up page (`/auth/signup`)
- [ ] Login page (`/auth/login`)
- [ ] Logout functionality
- [ ] Protected routes

### Business Management
- [ ] Create business page
- [ ] Join business with code
- [ ] Business dashboard
- [ ] Member management

### Transaction Recording
- [ ] Add transaction form
- [ ] Transaction list with filters
- [ ] Edit/delete transactions
- [ ] Payment source selection UI

### Capital & Partnership
- [ ] Set equity percentages
- [ ] Record initial capital
- [ ] View capital accounts

### Reports
- [ ] Profit & Loss report
- [ ] Cash Flow report
- [ ] Partner Capital Accounts

### Profit Distribution
- [ ] Profit distribution flow
- [ ] Preview allocations
- [ ] Confirm distribution

### Dashboard
- [ ] Current metrics
- [ ] Quick actions
- [ ] Recent activity feed

## Key Business Rules

### Payment Source Logic
```typescript
// When creating expense transaction:
if (payment_source === 'business') {
  // Cash leaves business account
  // Show in Cash Flow report
} else {
  // payment_source = partner's user_id
  // Create capital contribution record
  // Does NOT show in Cash Flow (partner paid personally)
}
```

### Equity Percentage
- Must total exactly 100% across all partners
- Can have decimals (e.g., 33.33%)
- Used for profit distribution calculations

### Capital Balance Calculation
```
Capital Balance =
  Initial Contributions
  + Additional Contributions
  + Partner-Paid Expenses (auto-tracked)
  + Profit Allocated
  - Withdrawals
```

### Profit Distribution
```
Partner's Share = (Total Distributed Amount) × (Partner's Equity %)
```

## Important Notes

1. **All UI text must be in Bahasa Indonesia**
2. **Currency format**: Always display as "Rp X,XXX,XXX"
3. **Security**: Never bypass RLS policies
4. **Transparency**: All partners see ALL transactions
5. **Mobile-friendly**: Responsive design required

## Database Schema Highlights

### Transaction Categories
- Revenue categories: No item tracking
- Expense categories: Some with item tracking (inventory)
- `has_item_field` determines if Item/Quantity fields show

### Transactions Table
- `payment_source`: 'business' or user_id (UUID)
- `paid_by_user_id`: NULL if business, partner's ID if personal
- Conditional fields: `item_name`, `quantity`, `quantity_unit`

### RLS Security
- Users can only access businesses they're members of
- All tables protected with Row-Level Security
- Helper functions: `is_business_member()`, `is_business_owner()`

## Development Tips

1. Use Server Components where possible for better performance
2. Use the provided query functions in `lib/supabase/queries.ts`
3. Follow TypeScript types strictly for type safety
4. Test payment source logic thoroughly (this is the unique feature!)
5. Add activity logs for all important actions

## Deployment

### Deploy to Vercel

```bash
npm run build
# Deploy using Vercel CLI or GitHub integration
```

Make sure to set environment variables in Vercel dashboard.

## Support

For issues or questions about:
- Database setup: See `supabase/README.md`
- Type definitions: See `types/index.ts`
- Helper functions: See `lib/utils.ts`

---

**Status**: ✅ Initial setup complete. Ready to implement Phase 1 features.

Start with authentication flow, then business creation, then transaction recording.
