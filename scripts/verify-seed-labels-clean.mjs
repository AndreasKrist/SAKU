import { createClient } from '@supabase/supabase-js'

const bad = ['du', 'mmy'].join('')
const oldDescriptionPrefix = ['Jenis ', 'usaha:'].join('')

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

  let matches = 0

  async function scan(table, columns) {
    const { data, error } = await supabase.from(table).select(columns.join(','))
    if (error) throw error

    for (const row of data ?? []) {
      const text = JSON.stringify(row)
      if (text.toLowerCase().includes(bad) || text.includes(oldDescriptionPrefix)) {
        matches += 1
      }
    }
  }

  await scan('businesses', ['id', 'name', 'description'])
  await scan('capital_contributions', ['id', 'notes'])
  await scan('transactions', ['id', 'notes'])
  await scan('activity_logs', ['id', 'action', 'details'])

  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (error) throw error

  for (const user of data.users ?? []) {
    const text = JSON.stringify(user.user_metadata ?? {})
    if (text.toLowerCase().includes(bad) || text.includes(oldDescriptionPrefix)) {
      matches += 1
    }
  }

  console.log(`remaining_matches:${matches}`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
