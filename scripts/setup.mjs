#!/usr/bin/env node
/**
 * Rally-OS interactive setup installer.
 *
 *   pnpm setup            interactive walkthrough
 *   pnpm setup -- --yes   accept defaults / keep existing values (CI-friendly)
 *
 * Walks a new install from zero to a working environment:
 *   1. Verifies prerequisites (Node 20+, pnpm).
 *   2. Creates or updates .env at the repo root (from infra/.env.example).
 *   3. Prompts for DATABASE_URL and verifies the connection.
 *   4. Prompts for ANTHROPIC_API_KEY and live-validates it against the API.
 *   5. Generates a NEXTAUTH_SECRET when missing.
 *   6. Runs prisma generate / db push / seed (each optional).
 *   7. Prints demo credentials and next steps.
 *
 * No dependencies beyond Node built-ins — runnable before `pnpm install`.
 */

import { createInterface } from 'node:readline/promises'
import { execSync, spawnSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const ENV_PATH = join(ROOT, '.env')
const ENV_EXAMPLE_PATH = join(ROOT, 'infra', '.env.example')

const YES = process.argv.includes('--yes') || process.argv.includes('-y')

const lime = (s) => `\x1b[92m${s}\x1b[0m`
const red = (s) => `\x1b[91m${s}\x1b[0m`
const dim = (s) => `\x1b[2m${s}\x1b[0m`
const bold = (s) => `\x1b[1m${s}\x1b[0m`

const rl = createInterface({ input: process.stdin, output: process.stdout })

async function ask(question, fallback) {
  if (YES) return fallback
  const suffix = fallback ? dim(` (${fallback})`) : ''
  const answer = (await rl.question(`  ${question}${suffix}: `)).trim()
  return answer || fallback
}

async function confirm(question, fallback = true) {
  if (YES) return fallback
  const answer = (await rl.question(`  ${question} ${dim(fallback ? '(Y/n)' : '(y/N)')}: `)).trim()
  if (!answer) return fallback
  return /^y(es)?$/i.test(answer)
}

function step(n, title) {
  console.log(`\n${lime(`[${n}/7]`)} ${bold(title)}`)
}

// ── env-file helpers ─────────────────────────────────────────────────────────

function readEnv() {
  if (!existsSync(ENV_PATH)) return {}
  const vars = {}
  for (const line of readFileSync(ENV_PATH, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/)
    if (m) vars[m[1]] = m[2]
  }
  return vars
}

function writeEnvVar(key, value) {
  let content = existsSync(ENV_PATH) ? readFileSync(ENV_PATH, 'utf8') : ''
  const line = `${key}="${value}"`
  const re = new RegExp(`^\\s*${key}\\s*=.*$`, 'm')
  content = re.test(content)
    ? content.replace(re, line)
    : content + (content.endsWith('\n') || content === '' ? '' : '\n') + line + '\n'
  writeFileSync(ENV_PATH, content)
}

// ── validation probes ────────────────────────────────────────────────────────

async function validateAnthropicKey(apiKey) {
  try {
    const res = await fetch('https://api.anthropic.com/v1/models?limit=1', {
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    })
    if (res.ok) return { ok: true }
    const body = await res.json().catch(() => ({}))
    return { ok: false, error: body?.error?.message ?? `HTTP ${res.status}` }
  } catch (error) {
    return { ok: false, error: `network error — ${error.message}` }
  }
}

function run(cmd, { optional = false } = {}) {
  console.log(dim(`  $ ${cmd}`))
  // Inject the freshly written .env: Prisma only auto-loads .env from the
  // package directory, so vars written to the repo-root .env this session
  // would otherwise be invisible to child processes.
  const result = spawnSync(cmd, {
    shell: true,
    stdio: 'inherit',
    cwd: ROOT,
    env: { ...process.env, ...readEnv() },
  })
  if (result.status !== 0 && !optional) {
    console.log(red(`  Command failed (exit ${result.status}).`))
    return false
  }
  return result.status === 0
}

// ── main ─────────────────────────────────────────────────────────────────────

console.log(bold('\n  Rally-OS Setup Installer'))
console.log(dim('  Concept → public team-site → operations. Let’s get you running.\n'))

// 1. Prerequisites
step(1, 'Checking prerequisites')
const nodeMajor = Number(process.versions.node.split('.')[0])
if (nodeMajor < 20) {
  console.log(red(`  Node 20+ required — you are on ${process.versions.node}.`))
  process.exit(1)
}
console.log(`  Node ${process.versions.node} ✓`)
try {
  const pnpmVersion = execSync('pnpm --version', { encoding: 'utf8' }).trim()
  console.log(`  pnpm ${pnpmVersion} ✓`)
} catch {
  console.log(red('  pnpm not found. Install it with: corepack enable pnpm'))
  process.exit(1)
}

// 2. .env file
step(2, 'Environment file')
if (!existsSync(ENV_PATH)) {
  copyFileSync(ENV_EXAMPLE_PATH, ENV_PATH)
  console.log(`  Created .env from infra/.env.example ✓`)
} else {
  console.log('  .env already exists — existing values are kept unless you change them.')
}
const env = readEnv()

// 3. Database
step(3, 'Database (PostgreSQL)')
console.log(dim('  Local Postgres, Neon, or Railway all work. Format:'))
console.log(dim('  postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public'))
const currentDb =
  env.DATABASE_URL && !env.DATABASE_URL.includes('user:password') ? env.DATABASE_URL : undefined
const dbUrl = await ask('DATABASE_URL', currentDb ?? 'postgresql://postgres:postgres@localhost:5432/rally_os?schema=public')
writeEnvVar('DATABASE_URL', dbUrl)
console.log('  Saved ✓')

// 4. Anthropic API key (AI features)
step(4, 'Anthropic API key (AI practice plans + player trends)')
console.log(dim('  Get a key at https://console.anthropic.com/settings/keys'))
console.log(dim('  Leave blank to skip — everything except AI features works without it.'))
const currentKey = env.ANTHROPIC_API_KEY && env.ANTHROPIC_API_KEY !== 'sk-ant-...' ? env.ANTHROPIC_API_KEY : undefined
const apiKey = await ask('ANTHROPIC_API_KEY', currentKey ?? '')
if (apiKey) {
  process.stdout.write('  Validating key against the Anthropic API… ')
  const result = await validateAnthropicKey(apiKey)
  if (result.ok) {
    console.log(lime('valid ✓'))
    writeEnvVar('ANTHROPIC_API_KEY', apiKey)
  } else {
    console.log(red(`failed (${result.error})`))
    if (await confirm('Save it anyway?', false)) writeEnvVar('ANTHROPIC_API_KEY', apiKey)
  }
} else {
  console.log(dim('  Skipped — AI features will throw until ANTHROPIC_API_KEY is set.'))
}

// 5. Auth secrets
step(5, 'Auth (next-auth)')
if (!env.NEXTAUTH_SECRET || env.NEXTAUTH_SECRET === 'change-me-in-production') {
  writeEnvVar('NEXTAUTH_SECRET', randomBytes(32).toString('base64'))
  console.log('  Generated NEXTAUTH_SECRET ✓')
} else {
  console.log('  NEXTAUTH_SECRET already set ✓')
}
const nextAuthUrl = await ask('NEXTAUTH_URL', env.NEXTAUTH_URL || 'http://localhost:3000')
writeEnvVar('NEXTAUTH_URL', nextAuthUrl)
console.log('  Saved ✓')

// 6. Database schema + seed
step(6, 'Prisma — generate client, push schema, seed demo data')
let dbReady = false
if (await confirm('Run pnpm db:generate now?')) {
  run('pnpm db:generate')
}
if (await confirm('Push the schema to the database (pnpm db:push)?')) {
  dbReady = run('pnpm db:push')
  if (!dbReady) {
    console.log(red('  Could not reach the database. Check DATABASE_URL and that Postgres is running,'))
    console.log(red('  then re-run: pnpm db:push && pnpm db:seed'))
  }
}
if (dbReady && (await confirm('Seed demo data (demo org, team, coach login)?'))) {
  run('pnpm db:seed', { optional: true })
}

// 7. Done
step(7, 'Done')
console.log(`
  ${bold('Start the coach portal:')}   pnpm --filter @rally/rally-os dev
  ${bold('Start the org builder:')}    pnpm --filter @rally/org-builder dev
  ${bold('Run the test suite:')}       pnpm turbo run test

  ${bold('Demo login')} ${dim('(after seeding)')}
    Email:     coach@example.com
    Password:  password123

  ${dim('Override demo credentials with SEED_COACH_EMAIL / SEED_COACH_PASSWORD before seeding.')}
`)

rl.close()
