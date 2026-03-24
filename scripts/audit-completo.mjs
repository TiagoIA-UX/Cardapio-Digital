#!/usr/bin/env node
/**
 * audit-completo.mjs
 * Script de auditoria contínua do Cardápio Digital.
 * Roda todas as verificações de qualidade de uma vez.
 *
 * Uso: node scripts/audit-completo.mjs
 * Exit code: 0 se tudo OK, 1 se há erros bloqueantes
 */

import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

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

function runCommand(cmd, args = [], options = {}) {
  const result = spawnSync(cmd, args, {
    cwd: ROOT,
    encoding: 'utf8',
    shell: true,
    timeout: 300_000,
    ...options,
  })
  return {
    success: result.status === 0,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    status: result.status ?? 1,
  }
}

// ── Coletar todos os arquivos .ts/.tsx (excluindo node_modules, .next) ───────
function collectTsFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (
      entry.name === 'node_modules' ||
      entry.name === '.next' ||
      entry.name === 'dist' ||
      entry.name === '.git'
    )
      continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      collectTsFiles(full, files)
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      files.push(full)
    }
  }
  return files
}

// ── Checks ───────────────────────────────────────────────────────────────────
const results = []
const blockingErrors = []
const auditWarnings = []

function addResult(label, passed, detail = '', blocking = true) {
  results.push({ label, passed, detail, blocking })
  if (!passed && blocking && detail) blockingErrors.push(`${label}: ${detail}`)
  if (!passed && !blocking && detail) auditWarnings.push(`${label}: ${detail}`)
}

// Build
function checkBuild() {
  console.log(info('2.1 Build...'))
  const r = runCommand('npx', ['next', 'build'])
  if (r.success) {
    addResult('Build', true)
  } else {
    const errLines = r.stderr
      .split('\n')
      .filter((l) => l.includes('Error') || l.includes('error'))
      .slice(0, 5)
      .join(' | ')
    addResult('Build', false, errLines || 'Falha no build', true)
  }
}

// Lint
function checkLint() {
  console.log(info('2.1 Lint...'))
  const r = runCommand('npx', ['eslint', '.', '--max-warnings=0'])
  if (r.success) {
    addResult('Lint', true)
  } else {
    const problems = r.stdout
      .split('\n')
      .filter((l) => l.trim())
      .slice(0, 5)
      .join(' | ')
    addResult('Lint', false, problems || 'Erros de lint', true)
  }
}

// TypeScript
function checkTypes() {
  console.log(info('2.1 TypeScript type check...'))
  const r = runCommand('npx', ['tsc', '--noEmit'])
  if (r.success) {
    addResult('TypeScript', true)
  } else {
    const typeErrors = r.stdout
      .split('\n')
      .filter((l) => l.trim())
      .slice(0, 5)
      .join(' | ')
    addResult('TypeScript', false, typeErrors || 'Erros de tipo', true)
  }
}

// Testes
function checkTests() {
  console.log(info('2.1 Testes...'))
  const testsDir = path.join(ROOT, 'tests')
  if (!fs.existsSync(testsDir)) {
    addResult('Testes', true, 'Diretório tests/ não encontrado — pulando', false)
    return
  }
  const r = runCommand('npx', ['tsx', '--test', 'tests/**/*.test.ts'])
  if (r.success) {
    addResult('Testes', true)
  } else {
    const testOutput = (r.stdout + r.stderr).split('\n').slice(0, 10).join(' | ')
    addResult('Testes', false, testOutput || 'Falhas nos testes', true)
  }
}

// Migrations
function checkMigrations() {
  console.log(info('2.1 Migrations...'))
  const migrationsDir = path.join(ROOT, 'supabase', 'migrations')
  if (!fs.existsSync(migrationsDir)) {
    addResult('Migrations', false, 'Diretório não encontrado', true)
    return
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  const nums = files.map((f) => {
    const match = f.match(/^(\d+)_/)
    return match ? parseInt(match[1], 10) : null
  })
  const duplicates = nums.filter((n, i) => n !== null && nums.indexOf(n) !== i)

  if (duplicates.length > 0) {
    addResult(`Migrations (${files.length})`, false, `Duplicatas: ${duplicates.join(', ')}`, true)
  } else {
    addResult(`Migrations (${files.length} OK)`, true)
  }
}

// console.log em produção
function checkConsoleLogs() {
  console.log(info('2.1 console.log em código de produção...'))
  const tsFiles = collectTsFiles(ROOT).filter(
    (f) => !f.includes('/scripts/') && !f.includes('/tests/')
  )

  const hits = []
  for (const file of tsFiles) {
    const content = fs.readFileSync(file, 'utf8')
    const lines = content.split('\n')
    lines.forEach((line, i) => {
      if (/console\.log\s*\(/.test(line) && !line.trim().startsWith('//')) {
        hits.push(`${path.relative(ROOT, file)}:${i + 1}`)
      }
    })
  }

  if (hits.length === 0) {
    addResult('Sem console.log em produção', true)
  } else {
    addResult(
      `console.log em produção (${hits.length} ocorrência(s))`,
      false,
      hits.slice(0, 5).join(', '),
      false // não bloqueante — aviso
    )
  }
}

// `any` no TypeScript
function checkAnyUsage() {
  console.log(info('2.1 Uso de `any` no TypeScript...'))
  const tsFiles = collectTsFiles(ROOT).filter(
    (f) =>
      !f.includes('/node_modules/') &&
      !f.includes('/.next/') &&
      !f.includes('/scripts/') &&
      !f.endsWith('.d.ts')
  )

  const hits = []
  for (const file of tsFiles) {
    const content = fs.readFileSync(file, 'utf8')
    const lines = content.split('\n')
    lines.forEach((line, i) => {
      // Detectar `: any` ou `as any` — excluindo comentários
      if (/(?::\s*any\b|as\s+any\b)/.test(line) && !line.trim().startsWith('//')) {
        hits.push(`${path.relative(ROOT, file)}:${i + 1}`)
      }
    })
  }

  if (hits.length === 0) {
    addResult('Sem `any` no TypeScript', true)
  } else {
    addResult(
      `Uso de \`any\` (${hits.length} ocorrência(s))`,
      false,
      hits.slice(0, 5).join(', '),
      false // não bloqueante — aviso
    )
  }
}

// Arquivos grandes (> 500 linhas)
function checkLargeFiles() {
  console.log(info('2.1 Arquivos grandes (> 500 linhas)...'))
  const tsFiles = collectTsFiles(ROOT)

  const large = []
  for (const file of tsFiles) {
    const content = fs.readFileSync(file, 'utf8')
    const lineCount = content.split('\n').length
    if (lineCount > 500) {
      large.push(`${path.relative(ROOT, file)} (${lineCount} linhas)`)
    }
  }

  if (large.length === 0) {
    addResult('Sem arquivos grandes', true)
  } else {
    addResult(
      `Arquivos grandes (${large.length})`,
      false,
      large.slice(0, 3).join(', '),
      false // não bloqueante — aviso
    )
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n')
  console.log(`${C.bold}${C.cyan}Cardápio Digital — Auditoria Completa${C.reset}`)
  console.log(`${C.cyan}${'─'.repeat(42)}${C.reset}\n`)

  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true })
  }

  const startTime = Date.now()

  checkBuild()
  checkLint()
  checkTypes()
  checkTests()
  checkMigrations()
  checkConsoleLogs()
  checkAnyUsage()
  checkLargeFiles()

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  const failed = results.filter((r) => !r.passed)
  const blocking = failed.filter((r) => r.blocking)
  const nonBlocking = failed.filter((r) => !r.blocking)
  const passed = results.filter((r) => r.passed)

  // Output
  console.log(`\n${C.bold}Resultado da Auditoria:${C.reset}`)
  for (const { label, passed: p, detail, blocking: b } of results) {
    if (p) {
      console.log(`  ${ok(label)}`)
    } else if (b) {
      console.log(`  ${fail(label)}${detail ? ` — ${detail.slice(0, 80)}` : ''}`)
    } else {
      console.log(`  ${warn(label)}${detail ? ` — ${detail.slice(0, 80)}` : ''}`)
    }
  }

  console.log('')
  console.log(info(`Tempo total: ${elapsed}s`))
  console.log(info(`Passou: ${passed.length}/${results.length}`))

  if (blocking.length > 0) {
    console.log(`\n${C.red}${C.bold}Erros bloqueantes (${blocking.length}):${C.reset}`)
    for (const e of blockingErrors) {
      console.log(`  ${C.red}•${C.reset} ${e.slice(0, 200)}`)
    }
  }

  if (nonBlocking.length > 0) {
    console.log(`\n${C.yellow}Avisos (${nonBlocking.length}):${C.reset}`)
    for (const w of auditWarnings) {
      console.log(`  ${C.yellow}•${C.reset} ${w.slice(0, 200)}`)
    }
  }

  if (blocking.length === 0) {
    console.log(`\n${C.green}${C.bold}✅ Auditoria concluída sem erros bloqueantes!${C.reset}`)
  }

  // Salvar relatório JSON
  const report = {
    timestamp: new Date().toISOString(),
    elapsed_seconds: parseFloat(elapsed),
    summary: {
      passed: passed.length,
      failed_blocking: blocking.length,
      failed_warnings: nonBlocking.length,
      total: results.length,
    },
    results,
    blocking_errors: blockingErrors,
    warnings: auditWarnings,
  }

  const reportPath = path.join(REPORTS_DIR, 'audit-report.json')
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(info(`Relatório salvo em: reports/audit-report.json\n`))

  process.exit(blocking.length > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error(`${C.red}Erro fatal:${C.reset}`, err)
  process.exit(1)
})
