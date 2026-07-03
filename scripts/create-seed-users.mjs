import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const DEFAULT_OUTPUT = 'scripts/seed-users-created.local.csv'

function usage() {
  console.log(`
Usage:
  node --env-file=.env.local scripts/create-seed-users.mjs --file scripts/seed-emails.local.txt --password "SakuSeed123!"
  node --env-file=.env.local scripts/create-seed-users.mjs --file scripts/seed-emails.local.txt --random-passwords
  node scripts/create-seed-users.mjs --file scripts/seed-emails.local.txt --dry-run

Options:
  --file <path>          Text file with one email per line
  --password <value>     Shared password for all created users
  --random-passwords     Generate a unique password per user
  --output <path>        CSV output for generated/created credentials
  --dry-run              Validate and preview without calling Supabase
`)
}

function readArgs(argv) {
  const args = {
    file: '',
    password: '',
    randomPasswords: false,
    output: DEFAULT_OUTPUT,
    dryRun: false,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    const next = argv[index + 1]

    if (arg === '--file') {
      args.file = next ?? ''
      index += 1
    } else if (arg === '--password') {
      args.password = next ?? ''
      index += 1
    } else if (arg === '--random-passwords') {
      args.randomPasswords = true
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
  if (!filePath) {
    throw new Error('Missing --file <path>.')
  }

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

function displayNameFromEmail(email) {
  const localPart = email.split('@')[0]
  const cleaned = localPart
    .replace(/[._-]+/g, ' ')
    .replace(/\d+/g, '')
    .trim()

  if (!cleaned) return 'Seed User'

  return cleaned
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function randomPassword() {
  return `${randomBytes(12).toString('base64url')}Aa1!`
}

function csvCell(value) {
  return `"${String(value).replaceAll('"', '""')}"`
}

async function main() {
  const args = readArgs(process.argv.slice(2))

  if (args.password && args.randomPasswords) {
    throw new Error('Use either --password or --random-passwords, not both.')
  }

  if (!args.dryRun && !args.password && !args.randomPasswords) {
    throw new Error('Choose --password <value> or --random-passwords.')
  }

  const emails = parseEmails(args.file)

  console.log(`Found ${emails.length} unique email(s).`)

  if (args.dryRun) {
    for (const email of emails) {
      console.log(`DRY RUN ${email} -> ${displayNameFromEmail(email)}`)
    }
    return
  }

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

  const rows = [['email', 'password', 'user_id', 'status']]

  for (const email of emails) {
    const password = args.randomPasswords ? randomPassword() : args.password
    const fullName = displayNameFromEmail(email)

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        phone: '',
      },
    })

    if (error) {
      const alreadyExists = error.message.toLowerCase().includes('already')
      const status = alreadyExists ? 'skipped_existing' : `error: ${error.message}`
      rows.push([email, alreadyExists ? '' : password, '', status])
      console.log(`${alreadyExists ? '-' : 'x'} ${email}: ${status}`)
      continue
    }

    rows.push([email, password, data.user?.id ?? '', 'created'])
    console.log(`+ ${email}: created`)
  }

  const csv = rows.map((row) => row.map(csvCell).join(',')).join('\n')
  writeFileSync(args.output, `${csv}\n`, 'utf8')
  console.log(`\nWrote result CSV to ${args.output}`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
