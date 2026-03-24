#!/usr/bin/env node
/**
 * setup-completo.mjs
 * Script master de setup e auditoria do Cardápio Digital.
 * Valida ambiente, dependências, build, lint, tipos e migrations.
 *
 * Uso: node scripts/setup-completo.mjs
 */

import fs from 'node:fs'
import path from 'node:path'
import { execSync, spawnSync } from 'node:child_process'

const ROOT = process.cwd()
const REPORTS_DIR = path.join(ROOT, 'reports')

// ── Cores ANSI ───────────────────────────────────────────────────────────────
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
}

function ok(msg) {
  return `${C.green}✅${C.reset} ${msg}`
}
function fail(msg) {
  return `${C.red}❌${C.reset} ${msg}`
}
function warn(msg) {
  return `${C.yellow}⚠️ ${C.reset} ${msg}`
}
function info(msg) {
  return `${C.cyan}ℹ️ ${C.reset} ${msg}`
}

// ── Utilitários ──────────────────────────────────────────────────────────────
function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {}
  const content = fs.readFileSync(filePath, 'utf8')
  const result = {}
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const sep = trimmed.indexOf('=')
    if (sep === -1) continue
    result[trimmed.slice(0, sep).trim()] = trimmed.slice(sep + 1).trim()
  }
  return result
}

function runCommand(cmd, args = [], options = {}) {
  const result = spawnSync(cmd, args, {
    cwd: ROOT,
    encoding: 'utf8',
    shell: true,
    ...options,
  })
  return {
    success: result.status === 0,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    status: result.status ?? 1,
  }
}

function box(lines) {
  const width = 42
  const border = '═'.repeat(width)
  const top = `╔${border}╗`
  const mid = `╠${border}╣`
  const bot = `╚${border}╝`

  const padded = lines.map((l) => {
    // Strip ANSI codes for length measurement
    const stripped = l.replace(/\x1b\[[0-9;]*m/g, '')
    const pad = width - stripped.length
    return `║ ${l}${' '.repeat(Math.max(0, pad - 1))}║`
  })

  return [top, ...padded.slice(0, 1), mid, ...padded.slice(1), bot].join('\n')
}

// ── Checks ───────────────────────────────────────────────────────────────────
const results = []
const errors = []
const warnings = []

function addResult(label, passed, detail = '') {
  results.push({ label, passed, detail })
  if (!passed && detail) errors.push(`${label}: ${detail}`)
}

// 1.1 Node.js e npm
function checkNodeNpm() {
  const nodeResult = runCommand('node', ['--version'])
  const nodeVersion = nodeResult.stdout.trim()
  const nodeMajor = parseInt(nodeVersion.replace('v', '').split('.')[0], 10)
  const nodeOk = [20, 22, 24].includes(nodeMajor)
  addResult(`Node.js ${nodeVersion}`, nodeOk, nodeOk ? '' : `Esperado: 20.x || 22.x || 24.x`)

  const npmResult = runCommand('npm', ['--version'])
  const npmVersion = npmResult.stdout.trim()
  const npmMajor = parseInt(npmVersion.split('.')[0], 10)
  const npmOk = [10, 11].includes(npmMajor)
  addResult(`npm v${npmVersion}`, npmOk, npmOk ? '' : `Esperado: 10.x || 11.x`)
}

// 1.1 .env.local
function checkEnvFile() {
  const envPath = path.join(ROOT, '.env.local')
  const examplePath = path.join(ROOT, '.env.example')

  if (!fs.existsSync(envPath)) {
    if (fs.existsSync(examplePath)) {
      fs.copyFileSync(examplePath, envPath)
      addResult('.env.local', true, 'Criado a partir de .env.example')
    } else {
      addResult('.env.local', false, 'Arquivo não encontrado e .env.example também ausente')
      return
    }
  }
  addResult('.env.local configurado', true)
}

// 1.1 Variáveis de ambiente
function checkEnvVars() {
  const envPath = path.join(ROOT, '.env.local')
  const fileVars = readEnvFile(envPath)
  const env = { ...fileVars, ...process.env }

  const required = [
    {
      key: 'NEXT_PUBLIC_SUPABASE_URL',
      hint: 'Supabase Dashboard → Settings → API → Project URL',
    },
    {
      key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      hint: 'Supabase Dashboard → Settings → API → anon key',
    },
    {
      key: 'SUPABASE_SERVICE_ROLE_KEY',
      hint: 'Supabase Dashboard → Settings → API → service_role key',
    },
    {
      key: 'MERCADOPAGO_ACCESS_TOKEN',
      hint: 'Mercado Pago Dashboard → Credenciais → Access Token de produção',
    },
    {
      key: 'MERCADOPAGO_PUBLIC_KEY',
      hint: 'Mercado Pago Dashboard → Credenciais → Public Key de produção',
    },
    { key: 'GROQ_API_KEY', hint: 'https://console.groq.com → API Keys' },
    { key: 'R2_ACCOUNT_ID', hint: 'Cloudflare Dashboard → R2 → Account ID' },
    { key: 'R2_ACCESS_KEY_ID', hint: 'Cloudflare Dashboard → R2 → Manage API tokens' },
    { key: 'R2_SECRET_ACCESS_KEY', hint: 'Cloudflare Dashboard → R2 → Manage API tokens' },
    { key: 'R2_BUCKET_NAME', hint: 'Cloudflare Dashboard → R2 → Nome do bucket' },
    {
      key: 'UPSTASH_REDIS_REST_URL',
      hint: 'Upstash Console → Redis → REST API → UPSTASH_REDIS_REST_URL',
    },
    {
      key: 'UPSTASH_REDIS_REST_TOKEN',
      hint: 'Upstash Console → Redis → REST API → UPSTASH_REDIS_REST_TOKEN',
    },
    { key: 'NEXT_PUBLIC_BASE_URL', hint: 'URL base do projeto, ex: https://seudominio.com' },
  ]

  const missing = required.filter(({ key }) => !env[key] || env[key] === '')

  if (missing.length === 0) {
    addResult(`Variáveis de ambiente (${required.length}/${required.length})`, true)
  } else {
    addResult(
      `Variáveis de ambiente (${required.length - missing.length}/${required.length})`,
      false,
      `Faltando: ${missing.map((v) => v.key).join(', ')}`
    )
    for (const { key, hint } of missing) {
      warnings.push(`  ${C.yellow}${key}${C.reset}: ${hint}`)
    }
  }
}

// 1.2 Dependências
function checkDependencies() {
  const nodeModules = path.join(ROOT, 'node_modules')
  if (!fs.existsSync(nodeModules)) {
    console.log(info('node_modules não encontrado. Rodando npm install...'))
    const result = runCommand('npm', ['install', '--prefer-offline'])
    addResult(
      'Dependências instaladas',
      result.success,
      result.success ? '' : 'npm install falhou'
    )
  } else {
    addResult('Dependências instaladas', true)
  }
}

// 1.3 Build
function checkBuild() {
  console.log(info('Verificando build (pode levar alguns minutos)...'))
  const result = runCommand('npx', ['next', 'build'], { timeout: 300_000 })
  if (result.success) {
    addResult('Build OK', true)
  } else {
    const errLines = result.stderr
      .split('\n')
      .filter((l) => l.includes('Error') || l.includes('error'))
      .slice(0, 5)
      .join('\n')
    addResult('Build OK', false, errLines || 'Falha no build')
  }
}

// 1.4 Lint
function checkLint() {
  console.log(info('Verificando lint...'))
  const result = runCommand('npx', ['eslint', '.', '--max-warnings=0'])
  if (result.success) {
    addResult('Lint OK', true)
  } else {
    const problems = result.stdout.split('\n').filter((l) => l.trim()).slice(0, 10).join('\n')
    addResult('Lint OK', false, problems || 'Erros de lint encontrados')
  }
}

// 1.5 TypeScript
function checkTypes() {
  console.log(info('Verificando tipos TypeScript...'))
  const result = runCommand('npx', ['tsc', '--noEmit'])
  if (result.success) {
    addResult('TypeScript OK', true)
  } else {
    const typeErrors = result.stdout.split('\n').filter((l) => l.trim()).slice(0, 10).join('\n')
    addResult('TypeScript OK', false, typeErrors || 'Erros de tipo encontrados')
  }
}

// 1.6 Migrations
function checkMigrations() {
  const migrationsDir = path.join(ROOT, 'supabase', 'migrations')
  if (!fs.existsSync(migrationsDir)) {
    addResult('Migrations', false, 'Diretório supabase/migrations não encontrado')
    return
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  if (files.length === 0) {
    addResult('Migrations', false, 'Nenhum arquivo .sql encontrado')
    return
  }

  // Verificar ordem numérica
  const numericMigrations = files
    .map((f) => {
      const match = f.match(/^(\d+)_/)
      return match ? { file: f, num: parseInt(match[1], 10) } : null
    })
    .filter(Boolean)

  // Verificar duplicatas de número
  const nums = numericMigrations.map((m) => m.num)
  const duplicates = nums.filter((n, i) => nums.indexOf(n) !== i)

  if (duplicates.length > 0) {
    addResult(
      `Migrations (${files.length} arquivos)`,
      false,
      `Números duplicados: ${duplicates.join(', ')}`
    )
  } else {
    addResult(`Migrations (${files.length} arquivos, OK)`, true)
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n')
  console.log(`${C.bold}${C.cyan}Cardápio Digital — Setup Completo${C.reset}`)
  console.log(`${C.cyan}${'─'.repeat(42)}${C.reset}\n`)

  // Garantir que a pasta reports existe
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true })
  }

  const startTime = Date.now()

  checkNodeNpm()
  checkEnvFile()
  checkEnvVars()
  checkDependencies()
  checkBuild()
  checkLint()
  checkTypes()
  checkMigrations()

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  const failedCount = results.filter((r) => !r.passed).length
  const passedCount = results.filter((r) => r.passed).length

  // Gerar output visual
  const lines = [`${C.bold}CARDÁPIO DIGITAL — SETUP COMPLETO${C.reset}`]
  for (const { label, passed, detail } of results) {
    const icon = passed ? `${C.green}✅${C.reset}` : `${C.red}❌${C.reset}`
    const detailStr = detail && !passed ? ` (${detail.slice(0, 30)})` : ''
    lines.push(`${icon} ${label}${detailStr}`)
  }
  lines.push('')

  if (failedCount === 0) {
    lines.push(`${C.green}🎉 Tudo pronto! Rode: npm run dev${C.reset}`)
  } else {
    lines.push(
      `${C.red}⚠️  ${failedCount} problema(s) encontrado(s). Veja abaixo.${C.reset}`
    )
  }

  console.log(box(lines))

  if (warnings.length > 0) {
    console.log(`\n${C.yellow}Variáveis de ambiente faltando:${C.reset}`)
    for (const w of warnings) {
      console.log(w)
    }
  }

  if (errors.length > 0) {
    console.log(`\n${C.red}Problemas encontrados:${C.reset}`)
    for (const e of errors) {
      console.log(`  ${C.red}•${C.reset} ${e.slice(0, 200)}`)
    }
  }

  console.log(`\n${info(`Tempo total: ${elapsed}s`)}`)
  console.log(info(`Verificações: ${passedCount}/${results.length} passaram`))

  // Salvar relatório JSON
  const report = {
    timestamp: new Date().toISOString(),
    elapsed_seconds: parseFloat(elapsed),
    summary: { passed: passedCount, failed: failedCount, total: results.length },
    results,
    errors,
    warnings: warnings.map((w) => w.replace(/\x1b\[[0-9;]*m/g, '')),
  }

  const reportPath = path.join(REPORTS_DIR, 'setup-report.json')
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(info(`Relatório salvo em: reports/setup-report.json\n`))

  process.exit(failedCount > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error(`${C.red}Erro fatal:${C.reset}`, err)
  process.exit(1)
})
