import { createClient } from '@supabase/supabase-js'

const bad = ['du', 'mmy'].join('')

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.')
  }

  const supabase = createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (error) throw error

  let updated = 0

  for (const user of data.users ?? []) {
    const text = JSON.stringify(user.user_metadata ?? {})
    if (!text.toLowerCase().includes(bad)) continue

    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: null,
    })

    if (updateError) throw updateError
    updated += 1
  }

  console.log(`auth_users_cleared:${updated}`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
