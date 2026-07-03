import { createClient } from '@supabase/supabase-js'

const oldLower = ['du', 'mmy'].join('')
const oldTitle = oldLower.charAt(0).toUpperCase() + oldLower.slice(1)
const oldDescriptionPrefix = ['Jenis ', 'usaha:'].join('')

function cleanText(value) {
  if (typeof value !== 'string') return value

  return value
    .replace(new RegExp(`^\\s*${oldDescriptionPrefix}\\s*`, 'i'), '')
    .replace(new RegExp(`\\s*${oldTitle}\\s*`, 'g'), ' ')
    .replace(new RegExp(`\\s*${oldLower}\\s*`, 'gi'), ' ')
    .replace(/\s+-\s+/g, ' - ')
    .replace(/^UMKM\s+(\d{2})\s+-/, 'UMKM $1 -')
    .replace(/\s+/g, ' ')
    .trim()
}

function cleanJson(value) {
  if (!value || typeof value !== 'object') return value

  if (Array.isArray(value)) {
    return value.map(cleanJson)
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key.toLowerCase() !== `is_${oldLower}`)
      .map(([key, item]) => [cleanText(key), typeof item === 'string' ? cleanText(item) : cleanJson(item)])
  )
}

async function updateChangedRows(supabase, table, selectColumns, updateBuilder) {
  const { data, error } = await supabase.from(table).select(selectColumns)
  if (error) throw error

  let updated = 0

  for (const row of data ?? []) {
    const patch = updateBuilder(row)
    if (!patch || Object.keys(patch).length === 0) continue

    const { error: updateError } = await supabase.from(table).update(patch).eq('id', row.id)
    if (updateError) throw updateError
    updated += 1
  }

  return updated
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.')
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  const businesses = await updateChangedRows(supabase, 'businesses', 'id,name,description', (row) => {
    const name = cleanText(row.name)
    const description = cleanText(row.description)
    const patch = {}
    if (name !== row.name) patch.name = name
    if (description !== row.description) patch.description = description
    return patch
  })

  const contributions = await updateChangedRows(supabase, 'capital_contributions', 'id,notes', (row) => {
    const notes = cleanText(row.notes)
    return notes !== row.notes ? { notes } : {}
  })

  const transactions = await updateChangedRows(supabase, 'transactions', 'id,notes', (row) => {
    const notes = cleanText(row.notes)
    return notes !== row.notes ? { notes } : {}
  })

  const activities = await updateChangedRows(supabase, 'activity_logs', 'id,action,details', (row) => {
    const action = row.action === `${oldLower}_business_created`
      ? 'seed_business_created'
      : cleanText(row.action)
    const details = cleanJson(row.details)
    const patch = {}
    if (action !== row.action) patch.action = action
    if (JSON.stringify(details) !== JSON.stringify(row.details)) patch.details = details
    return patch
  })

  const { data: users, error: userError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (userError) throw userError

  let authUsers = 0
  for (const user of users.users ?? []) {
    const metadata = cleanJson(user.user_metadata)
    if (JSON.stringify(metadata) === JSON.stringify(user.user_metadata)) continue

    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: metadata,
    })
    if (error) throw error
    authUsers += 1
  }

  console.log(`businesses:${businesses}`)
  console.log(`capital_contributions:${contributions}`)
  console.log(`transactions:${transactions}`)
  console.log(`activity_logs:${activities}`)
  console.log(`auth_users:${authUsers}`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
