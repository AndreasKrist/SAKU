import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const DEFAULT_EMAIL_FILE = 'scripts/seed-emails.local.txt'
const DEFAULT_TYPE_FILE = 'scripts/seed-business-types.local.txt'
const DEFAULT_OUTPUT = 'scripts/seed-businesses-created.local.csv'
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function usage() {
  console.log(`
Usage:
  node --env-file=.env.local scripts/create-seed-businesses-from-types.mjs --with-sample-data
  node scripts/create-seed-businesses-from-types.mjs --dry-run

Options:
  --emails <path>        Text file with one owner email per line
  --types <path>         Text file with one business type per line
  --prefix <value>       Business name prefix
  --start-date <date>    Business start date in YYYY-MM-DD
  --with-sample-data     Add one capital contribution and sample transactions
  --allow-duplicates     Create rows even when the generated business name exists
  --output <path>        CSV output with created business details
  --dry-run              Preview without calling Supabase
`)
}

function readArgs(argv) {
  const args = {
    emails: DEFAULT_EMAIL_FILE,
    types: DEFAULT_TYPE_FILE,
    prefix: 'UMKM',
    startDate: new Date().toISOString().slice(0, 10),
    withSampleData: false,
    allowDuplicates: false,
    output: DEFAULT_OUTPUT,
    dryRun: false,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    const next = argv[index + 1]

    if (arg === '--emails') {
      args.emails = next ?? DEFAULT_EMAIL_FILE
      index += 1
    } else if (arg === '--types') {
      args.types = next ?? DEFAULT_TYPE_FILE
      index += 1
    } else if (arg === '--prefix') {
      args.prefix = next ?? args.prefix
      index += 1
    } else if (arg === '--start-date') {
      args.startDate = next ?? args.startDate
      index += 1
    } else if (arg === '--with-sample-data') {
      args.withSampleData = true
    } else if (arg === '--allow-duplicates') {
      args.allowDuplicates = true
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

function readNonEmptyLines(filePath, label) {
  if (!existsSync(filePath)) {
    throw new Error(`${label} file not found: ${filePath}`)
  }

  return readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
}

function parseEmails(filePath) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const seen = new Set()
  const invalid = []
  const emails = []

  for (const rawEmail of readNonEmptyLines(filePath, 'Email')) {
    const email = rawEmail.toLowerCase()

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

function titleCase(value) {
  return value
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
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

  return profilesByEmail
}

async function loadCategories(supabase) {
  const { data, error } = await supabase
    .from('transaction_categories')
    .select('id,type')
    .eq('is_active', true)

  if (error) throw error

  return {
    revenue: data?.find((category) => category.type === 'revenue')?.id ?? null,
    expense: data?.find((category) => category.type === 'expense')?.id ?? null,
  }
}

function addDays(dateValue, days) {
  const date = new Date(`${dateValue}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

async function createSampleData(supabase, business, owner, categories, startDate, index) {
  const contributionAmount = 750000 + index * 50000

  const { error: contributionError } = await supabase
    .from('capital_contributions')
    .insert({
      business_id: business.id,
      user_id: owner.id,
      amount: contributionAmount,
      type: 'initial',
      notes: 'Initial capital',
      contribution_date: startDate,
    })

  if (contributionError) throw contributionError

  const transactionRows = [
    {
      type: 'revenue',
      category_id: categories.revenue,
      amount: 900000 + index * 25000,
      notes: 'Pendapatan awal',
      transaction_date: startDate,
    },
    {
      type: 'expense',
      category_id: categories.expense,
      amount: 250000 + index * 10000,
      notes: 'Biaya operasional',
      transaction_date: addDays(startDate, 3),
    },
  ].map((transaction) => ({
    ...transaction,
    business_id: business.id,
    payment_source: 'business',
    paid_by_user_id: null,
    created_by: owner.id,
  }))

  const { error: transactionError } = await supabase
    .from('transactions')
    .insert(transactionRows)

  if (transactionError) throw transactionError
}

function csvCell(value) {
  return `"${String(value).replaceAll('"', '""')}"`
}

async function main() {
  const args = readArgs(process.argv.slice(2))
  validateDate(args.startDate)

  const emails = parseEmails(args.emails)
  const businessTypes = readNonEmptyLines(args.types, 'Business type')

  if (businessTypes.length === 0) {
    throw new Error('No business types found.')
  }

  console.log(`Business types: ${businessTypes.length}`)
  console.log(`Owner emails: ${emails.length}`)
  console.log(`Sample data: ${args.withSampleData ? 'yes' : 'no'}`)

  const planned = businessTypes.map((businessType, index) => {
    const number = String(index + 1).padStart(2, '0')
    const name = `${args.prefix} ${number} - ${titleCase(businessType)}`
    const ownerEmail = emails[index % emails.length]
    return { number, name, businessType, ownerEmail }
  })

  if (args.dryRun) {
    for (const plan of planned) {
      console.log(`DRY RUN ${plan.name} -> ${plan.ownerEmail}`)
    }
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

  const profilesByEmail = await loadProfiles(supabase, emails)
  const categories = args.withSampleData ? await loadCategories(supabase) : null
  const rows = [['business_id', 'business_code', 'name', 'business_type', 'owner_email', 'status']]

  for (const [index, plan] of planned.entries()) {
    const owner = profilesByEmail.get(plan.ownerEmail)

    if (!args.allowDuplicates) {
      const { data: existing, error: existingError } = await supabase
        .from('businesses')
        .select('id,business_code')
        .eq('name', plan.name)
        .maybeSingle()

      if (existingError) throw existingError

      if (existing) {
        rows.push([existing.id, existing.business_code, plan.name, plan.businessType, plan.ownerEmail, 'skipped_existing'])
        console.log(`- ${plan.name}: already exists`)
        continue
      }
    }

    const businessCode = await generateUniqueBusinessCode(supabase)
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .insert({
        name: plan.name,
        description: plan.businessType,
        business_code: businessCode,
        invite_link: `${appUrl}/bisnis/gabung?code=${businessCode}`,
        start_date: args.startDate,
        created_by: owner.id,
        auto_update_equity_on_contribution: true,
      })
      .select()
      .single()

    if (businessError) throw businessError

    const { error: memberError } = await supabase
      .from('business_members')
      .insert({
        business_id: business.id,
        user_id: owner.id,
        role: 'owner',
        equity_percentage: 100,
      })

    if (memberError) throw memberError

    await supabase.from('activity_logs').insert({
      business_id: business.id,
      user_id: owner.id,
      action: 'seed_business_created',
      entity_type: 'business',
      entity_id: business.id,
      details: {
        business_type: plan.businessType,
        with_sample_data: args.withSampleData,
      },
    })

    if (args.withSampleData) {
      await createSampleData(supabase, business, owner, categories, args.startDate, index)
    }

    rows.push([business.id, business.business_code, business.name, plan.businessType, plan.ownerEmail, 'created'])
    console.log(`+ ${business.name}: ${business.business_code}`)
  }

  const csv = rows.map((row) => row.map(csvCell).join(',')).join('\n')
  writeFileSync(args.output, `${csv}\n`, 'utf8')
  console.log(`\nWrote result CSV to ${args.output}`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
