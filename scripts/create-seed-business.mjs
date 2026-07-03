import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const DEFAULT_EMAIL_FILE = 'scripts/seed-emails.local.txt'
const DEFAULT_OUTPUT = 'scripts/seed-business-created.local.csv'
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function usage() {
  console.log(`
Usage:
  node --env-file=.env.local scripts/create-seed-business.mjs
  node --env-file=.env.local scripts/create-seed-business.mjs --name "Warung SAKU" --with-sample-data
  node scripts/create-seed-business.mjs --dry-run

Options:
  --file <path>          Text file with one email per line
  --name <value>         Business name
  --description <value>  Business description
  --owner-email <email>  Owner email. Defaults to the first email in the file
  --start-date <date>    Business start date in YYYY-MM-DD
  --code <value>         Custom business code, e.g. BIZ-DEMO01
  --with-sample-data     Add capital contributions and sample transactions
  --output <path>        CSV output with created business details
  --dry-run              Preview without calling Supabase
`)
}

function readArgs(argv) {
  const args = {
    file: DEFAULT_EMAIL_FILE,
    name: 'Warung SAKU',
    description: 'Seed business for testing SAKU with seeded members.',
    ownerEmail: '',
    startDate: new Date().toISOString().slice(0, 10),
    code: '',
    withSampleData: false,
    output: DEFAULT_OUTPUT,
    dryRun: false,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    const next = argv[index + 1]

    if (arg === '--file') {
      args.file = next ?? DEFAULT_EMAIL_FILE
      index += 1
    } else if (arg === '--name') {
      args.name = next ?? args.name
      index += 1
    } else if (arg === '--description') {
      args.description = next ?? ''
      index += 1
    } else if (arg === '--owner-email') {
      args.ownerEmail = (next ?? '').toLowerCase()
      index += 1
    } else if (arg === '--start-date') {
      args.startDate = next ?? args.startDate
      index += 1
    } else if (arg === '--code') {
      args.code = (next ?? '').toUpperCase()
      index += 1
    } else if (arg === '--with-sample-data') {
      args.withSampleData = true
    } else if (arg === '--output') {
      args.output = next ?? DEFAULT_OUTPUT
      index += 1
    } else if (arg === '--dry-run') {
      args.dryRun = true
    } else if (arg === '--help' || arg === '-h') {
      usage()
      process.exit(0)
    } else {
      throw new Error(`Unknown option: ${arg}`)
    }
  }

  return args
}

function parseEmails(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(`Email file not found: ${filePath}`)
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const seen = new Set()
  const invalid = []
  const emails = []

  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/)

  for (const rawLine of lines) {
    const email = rawLine.trim().toLowerCase()
    if (!email || email.startsWith('#')) continue

    if (!emailPattern.test(email)) {
      invalid.push(email)
      continue
    }

    if (!seen.has(email)) {
      seen.add(email)
      emails.push(email)
    }
  }

  if (invalid.length > 0) {
    throw new Error(`Invalid emails:\n${invalid.join('\n')}`)
  }

  if (emails.length === 0) {
    throw new Error('No valid emails found.')
  }

  return emails
}

function validateDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`Invalid --start-date "${value}". Use YYYY-MM-DD.`)
  }
}

function validateBusinessCode(value) {
  if (value && !/^BIZ-[A-Z0-9]{4,12}$/.test(value)) {
    throw new Error('Invalid --code. Use a value like BIZ-DEMO01.')
  }
}

function generateBusinessCode() {
  let code = 'BIZ-'
  for (let index = 0; index < 6; index += 1) {
    code += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length))
  }
  return code
}

async function generateUniqueBusinessCode(supabase) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = generateBusinessCode()
    const { data, error } = await supabase
      .from('businesses')
      .select('id')
      .eq('business_code', code)
      .maybeSingle()

    if (error) throw error
    if (!data) return code
  }

  throw new Error('Could not generate a unique business code.')
}

function distributeEquity(memberCount) {
  const totalCents = 10000
  const base = Math.floor(totalCents / memberCount)
  const remainder = totalCents - base * memberCount

  return Array.from({ length: memberCount }, (_, index) => {
    const cents = base + (index < remainder ? 1 : 0)
    return cents / 100
  })
}

function csvCell(value) {
  return `"${String(value).replaceAll('"', '""')}"`
}

async function loadProfiles(supabase, emails) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id,email,full_name')
    .in('email', emails)

  if (error) {
    throw new Error(`Could not load profiles by email: ${error.message}`)
  }

  const profilesByEmail = new Map((data ?? []).map((profile) => [profile.email, profile]))
  const missing = emails.filter((email) => !profilesByEmail.has(email))

  if (missing.length > 0) {
    throw new Error(
      `These emails do not have profiles yet. Create the seed users first:\n${missing.join('\n')}`
    )
  }

  return emails.map((email) => profilesByEmail.get(email))
}

async function createSampleData(supabase, business, members, ownerId, startDate) {
  const contributionRows = members.map((member, index) => ({
    business_id: business.id,
    user_id: member.id,
    amount: 500000 + index * 25000,
    type: 'initial',
    notes: 'Initial capital',
    contribution_date: startDate,
  }))

  const { error: contributionError } = await supabase
    .from('capital_contributions')
    .insert(contributionRows)

  if (contributionError) throw contributionError

  const { data: categories } = await supabase
    .from('transaction_categories')
    .select('id,name,type')
    .eq('is_active', true)

  const revenueCategory = categories?.find((category) => category.type === 'revenue')
  const expenseCategory = categories?.find((category) => category.type === 'expense')

  const transactionRows = [
    {
      type: 'revenue',
      category_id: revenueCategory?.id ?? null,
      amount: 3200000,
      notes: 'Penjualan minggu 1',
      transaction_date: startDate,
    },
    {
      type: 'expense',
      category_id: expenseCategory?.id ?? null,
      amount: 850000,
      notes: 'Pembelian bahan',
      transaction_date: startDate,
    },
    {
      type: 'revenue',
      category_id: revenueCategory?.id ?? null,
      amount: 4100000,
      notes: 'Penjualan minggu 2',
      transaction_date: addDays(startDate, 7),
    },
    {
      type: 'expense',
      category_id: expenseCategory?.id ?? null,
      amount: 1200000,
      notes: 'Operasional',
      transaction_date: addDays(startDate, 14),
    },
  ].map((transaction) => ({
    ...transaction,
    business_id: business.id,
    payment_source: 'business',
    paid_by_user_id: null,
    created_by: ownerId,
  }))

  const { error: transactionError } = await supabase
    .from('transactions')
    .insert(transactionRows)

  if (transactionError) throw transactionError
}

function addDays(dateValue, days) {
  const date = new Date(`${dateValue}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

async function main() {
  const args = readArgs(process.argv.slice(2))
  validateDate(args.startDate)
  validateBusinessCode(args.code)

  const emails = parseEmails(args.file)
  const ownerEmail = args.ownerEmail || emails[0]

  if (!emails.includes(ownerEmail)) {
    throw new Error(`Owner email must exist in ${args.file}: ${ownerEmail}`)
  }

  const equity = distributeEquity(emails.length)

  console.log(`Business: ${args.name}`)
  console.log(`Members: ${emails.length}`)
  console.log(`Owner: ${ownerEmail}`)
  console.log(`Sample data: ${args.withSampleData ? 'yes' : 'no'}`)

  if (args.dryRun) {
    emails.forEach((email, index) => {
      const role = email === ownerEmail ? 'owner' : 'member'
      console.log(`DRY RUN ${email} -> ${role}, ${equity[index].toFixed(2)}%`)
    })
    return
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.')
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  const profiles = await loadProfiles(supabase, emails)
  const orderedProfiles = [...profiles].sort((a, b) => {
    if (a.email === ownerEmail) return -1
    if (b.email === ownerEmail) return 1
    return emails.indexOf(a.email) - emails.indexOf(b.email)
  })
  const businessCode = args.code || await generateUniqueBusinessCode(supabase)
  const owner = orderedProfiles[0]

  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .insert({
      name: args.name,
      description: args.description,
      business_code: businessCode,
      invite_link: `${appUrl}/bisnis/gabung?code=${businessCode}`,
      start_date: args.startDate,
      created_by: owner.id,
      auto_update_equity_on_contribution: true,
    })
    .select()
    .single()

  if (businessError) throw businessError

  const memberRows = orderedProfiles.map((profile, index) => ({
    business_id: business.id,
    user_id: profile.id,
    role: profile.email === ownerEmail ? 'owner' : 'member',
    equity_percentage: equity[index],
  }))

  const { error: memberError } = await supabase
    .from('business_members')
    .insert(memberRows)

  if (memberError) throw memberError

  await supabase.from('activity_logs').insert({
    business_id: business.id,
    user_id: owner.id,
    action: 'seed_business_created',
    entity_type: 'business',
    entity_id: business.id,
    details: {
      business_name: business.name,
      member_count: memberRows.length,
      with_sample_data: args.withSampleData,
    },
  })

  if (args.withSampleData) {
    await createSampleData(supabase, business, orderedProfiles, owner.id, args.startDate)
  }

  const rows = [
    ['business_id', 'business_code', 'name', 'owner_email', 'member_count', 'with_sample_data'],
    [business.id, business.business_code, business.name, ownerEmail, memberRows.length, args.withSampleData],
  ]
  const csv = rows.map((row) => row.map(csvCell).join(',')).join('\n')
  writeFileSync(args.output, `${csv}\n`, 'utf8')

  console.log(`Created business ${business.name} (${business.business_code})`)
  console.log(`Business ID: ${business.id}`)
  console.log(`Wrote result CSV to ${args.output}`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
