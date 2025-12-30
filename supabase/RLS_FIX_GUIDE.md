# RLS (Row-Level Security) Fix Guide

## Problem Overview

Currently, the application uses **service role key** to bypass RLS policies for business creation and joining operations. This is a **security risk** and not the recommended Supabase approach.

### Affected Files:
- `lib/actions/business.ts` (lines 85-149, 170-235)

### Current Implementation:
```typescript
// TEMPORARY WORKAROUND: Use service role key to bypass RLS
const supabaseWithAuth = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  }
)
```

## Why This Is a Problem

1. **Security Risk**: Service role key bypasses ALL RLS policies
2. **Not Scalable**: Defeats the purpose of RLS
3. **Against Best Practices**: Supabase recommends using RLS with JWT
4. **Hard to Maintain**: Requires special handling for every business operation

## Root Cause

The issue appears to be that JWT tokens are not properly propagated in Next.js Server Actions, causing RLS policies to fail authentication checks.

## Solution Options

### Option 1: Fix RLS Policies (Recommended)

Update your RLS policies to properly handle authenticated users. Here's the correct approach:

#### 1. Enable RLS on all tables (already done)
```sql
-- All tables should have RLS enabled
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_members ENABLE ROW LEVEL SECURITY;
-- etc...
```

#### 2. Create proper policies for businesses table

```sql
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view businesses they're members of" ON businesses;
DROP POLICY IF EXISTS "Users can create businesses" ON businesses;
DROP POLICY IF EXISTS "Users can update their businesses" ON businesses;

-- Policy 1: Allow users to view businesses they're members of
CREATE POLICY "select_businesses_for_members"
ON businesses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM business_members
    WHERE business_members.business_id = businesses.id
    AND business_members.user_id = auth.uid()
  )
);

-- Policy 2: Allow authenticated users to create businesses
CREATE POLICY "insert_businesses_for_authenticated"
ON businesses FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND created_by = auth.uid()
);

-- Policy 3: Allow owners to update their businesses
CREATE POLICY "update_businesses_for_owners"
ON businesses FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM business_members
    WHERE business_members.business_id = businesses.id
    AND business_members.user_id = auth.uid()
    AND business_members.role = 'owner'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM business_members
    WHERE business_members.business_id = businesses.id
    AND business_members.user_id = auth.uid()
    AND business_members.role = 'owner'
  )
);
```

#### 3. Create proper policies for business_members table

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view business members" ON business_members;
DROP POLICY IF EXISTS "Users can insert business members" ON business_members;
DROP POLICY IF EXISTS "Owners can update business members" ON business_members;

-- Policy 1: Allow users to view members of businesses they're in
CREATE POLICY "select_business_members_for_members"
ON business_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM business_members bm
    WHERE bm.business_id = business_members.business_id
    AND bm.user_id = auth.uid()
  )
);

-- Policy 2: Allow authenticated users to insert themselves or be added by owners
CREATE POLICY "insert_business_members_for_authenticated"
ON business_members FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (
    -- User can add themselves (joining)
    user_id = auth.uid()
    OR
    -- OR owner can add others
    EXISTS (
      SELECT 1 FROM business_members bm
      WHERE bm.business_id = business_members.business_id
      AND bm.user_id = auth.uid()
      AND bm.role = 'owner'
    )
  )
);

-- Policy 3: Allow owners to update member equity and roles
CREATE POLICY "update_business_members_for_owners"
ON business_members FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM business_members bm
    WHERE bm.business_id = business_members.business_id
    AND bm.user_id = auth.uid()
    AND bm.role = 'owner'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM business_members bm
    WHERE bm.business_id = business_members.business_id
    AND bm.user_id = auth.uid()
    AND bm.role = 'owner'
  )
);
```

#### 4. Update Server Actions to use regular client

Once RLS policies are fixed, update `lib/actions/business.ts`:

```typescript
export async function createBusiness(formData: {
  name: string
  description?: string
  startDate: string
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Tidak terautentikasi' }
  }

  // Generate unique business code
  let businessCode = generateBusinessCode()
  let isUnique = false
  let attempts = 0

  while (!isUnique && attempts < 10) {
    const { data: existing } = await supabase
      .from('businesses')
      .select('id')
      .eq('business_code', businessCode)
      .single()

    if (!existing) {
      isUnique = true
    } else {
      businessCode = generateBusinessCode()
      attempts++
    }
  }

  if (!isUnique) {
    return { error: 'Gagal membuat kode bisnis unik' }
  }

  const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/bisnis/gabung?code=${businessCode}`

  // Create business with regular authenticated client (RLS will handle permissions)
  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .insert({
      name: formData.name,
      description: formData.description || '',
      business_code: businessCode,
      invite_link: inviteLink,
      start_date: formData.startDate,
      created_by: user.id,
    })
    .select()
    .single()

  if (businessError) {
    return { error: businessError.message }
  }

  // Add creator as owner with 100% equity
  const { error: memberError } = await supabase
    .from('business_members')
    .insert({
      business_id: business.id,
      user_id: user.id,
      role: 'owner',
      equity_percentage: 100,
    })

  if (memberError) {
    return { error: memberError.message }
  }

  // Log activity
  await supabase.from('activity_logs').insert({
    business_id: business.id,
    user_id: user.id,
    action: 'business_created',
    entity_type: 'business',
    entity_id: business.id,
    details: { business_name: formData.name },
  })

  revalidatePath('/dashboard')
  return { success: true, business, businessId: business.id }
}
```

### Option 2: Use Database Functions (Alternative)

If RLS policies are too complex, create a database function with SECURITY DEFINER:

```sql
-- Create a function to create business and add owner
CREATE OR REPLACE FUNCTION create_business_with_owner(
  p_name TEXT,
  p_description TEXT,
  p_business_code TEXT,
  p_invite_link TEXT,
  p_start_date DATE,
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business_id UUID;
  v_result JSON;
BEGIN
  -- Insert business
  INSERT INTO businesses (name, description, business_code, invite_link, start_date, created_by)
  VALUES (p_name, p_description, p_business_code, p_invite_link, p_start_date, p_user_id)
  RETURNING id INTO v_business_id;

  -- Add owner
  INSERT INTO business_members (business_id, user_id, role, equity_percentage)
  VALUES (v_business_id, p_user_id, 'owner', 100);

  -- Log activity
  INSERT INTO activity_logs (business_id, user_id, action, entity_type, entity_id, details)
  VALUES (v_business_id, p_user_id, 'business_created', 'business', v_business_id,
          json_build_object('business_name', p_name));

  -- Return result
  SELECT json_build_object(
    'id', id,
    'name', name,
    'business_code', business_code,
    'invite_link', invite_link
  ) INTO v_result
  FROM businesses
  WHERE id = v_business_id;

  RETURN v_result;
END;
$$;
```

Then call it from your Server Action:

```typescript
const { data, error } = await supabase
  .rpc('create_business_with_owner', {
    p_name: formData.name,
    p_description: formData.description || '',
    p_business_code: businessCode,
    p_invite_link: inviteLink,
    p_start_date: formData.startDate,
    p_user_id: user.id,
  })
```

## Testing the Fix

After implementing the fix:

1. **Test Business Creation**:
   - Create a new business as authenticated user
   - Verify it appears in database
   - Verify creator is added as owner

2. **Test Business Joining**:
   - Use invite code to join a business
   - Verify member is added
   - Verify equity is 0% for new members

3. **Test Permissions**:
   - Try to view businesses you're not a member of (should fail)
   - Try to update equity as non-owner (should fail)
   - Verify owners can update equity

## Recommended Implementation Steps

1. **Backup your database** before making any changes
2. **Test in development first** with the new RLS policies
3. **Apply Option 1 (RLS Fix)** - it's the most secure and scalable
4. **Remove service role key usage** from business.ts
5. **Test all business operations** thoroughly
6. **Monitor for errors** in production

## Additional Security Recommendations

1. **Never expose service role key** in client-side code
2. **Use RLS policies** for all tables with sensitive data
3. **Audit RLS policies** regularly
4. **Test with different user roles** to ensure policies work correctly
5. **Use database functions with SECURITY DEFINER** only when necessary

## Questions?

If RLS policies still fail after these fixes, check:
1. Is the JWT properly set in the Supabase client?
2. Are there any middleware issues affecting authentication?
3. Is `auth.uid()` returning the correct user ID in Supabase?

Use this SQL to debug RLS:
```sql
-- Check current auth context
SELECT auth.uid(), auth.role();

-- Test if RLS allows the operation
SET LOCAL role = 'authenticated';
SET LOCAL request.jwt.claims = '{"sub": "YOUR-USER-UUID"}';
SELECT * FROM businesses; -- Should only show businesses you're a member of
```

## Status

- [ ] Backup database
- [ ] Implement new RLS policies (Option 1)
- [ ] Update business.ts to remove service role usage
- [ ] Test business creation
- [ ] Test business joining
- [ ] Test permission boundaries
- [ ] Deploy to production
- [ ] Monitor for errors

**Priority**: HIGH - This is a security issue that should be fixed before production deployment.
