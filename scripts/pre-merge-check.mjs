#!/usr/bin/env node
/**
 * scripts/pre-merge-check.mjs
 * Runs a series of quality checks before any merge.
 * Usage: npm run pre-merge
 */

import { execSync } from 'child_process'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const ROOT = process.cwd()
const REPORT_DIR = join(ROOT, 'reports')

const checks = [
  { name: 'TypeScript (tsc --noEmit)', cmd: 'npx tsc --noEmit' },
  { name: 'ESLint', cmd: 'npm run lint' },
  { name: 'Next.js Build', cmd: 'npm run build' },
]

const results = []
let allPassed = true

console.log('\n🔍 Pre-Merge Quality Check\n' + '='.repeat(40))

for (const check of checks) {
  process.stdout.write(`\n▶ ${check.name} ... `)
  const start = Date.now()
  try {
    execSync(check.cmd, { stdio: 'pipe', cwd: ROOT })
    const elapsed = ((Date.now() - start) / 1000).toFixed(1)
    console.log(`✅ passed (${elapsed}s)`)
    results.push({ check: check.name, status: 'passed', elapsed })
  } catch (err) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1)
    const output = (err.stdout?.toString() ?? '') + (err.stderr?.toString() ?? '')
    console.log(`❌ FAILED (${elapsed}s)`)
    console.error(output.trim().split('\n').slice(0, 20).join('\n'))
    results.push({ check: check.name, status: 'failed', elapsed, output: output.trim() })
    allPassed = false
  }
}

console.log('\n' + '='.repeat(40))

try {
  mkdirSync(REPORT_DIR, { recursive: true })
  const report = {
    timestamp: new Date().toISOString(),
    passed: allPassed,
    results,
  }
  writeFileSync(join(REPORT_DIR, 'pre-merge-report.json'), JSON.stringify(report, null, 2))
} catch {
  // non-fatal — report directory may be gitignored
}

if (allPassed) {
  console.log('\n✅ All checks passed — Safe to merge\n')
  process.exit(0)
} else {
  const failed = results.filter((r) => r.status === 'failed').map((r) => `  • ${r.check}`)
  console.error('\n❌ DO NOT MERGE — the following checks failed:\n' + failed.join('\n') + '\n')
  process.exit(1)
}
