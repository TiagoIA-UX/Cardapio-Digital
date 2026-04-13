import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildReadinessFingerprint,
  getReadinessSeverity,
  type ScriptsReadinessReport,
} from '@/lib/domains/ops/scripts-readiness'

function buildReport(overrides?: Partial<ScriptsReadinessReport>): ScriptsReadinessReport {
  return {
    generatedAt: '2026-04-12T14:00:00.000Z',
    summary: {
      total: 3,
      healthy: 2,
      attention: 1,
    },
    categories: [
      {
        key: 'seguranca',
        title: 'Seguranca e acesso',
        items: [
          {
            id: 'alert-webhook-url',
            label: 'ALERT_WEBHOOK_URL',
            ok: false,
            detail: 'Nao configurada',
          },
        ],
      },
    ],
    ...overrides,
  }
}

test('readiness severity fica critical para item critico', () => {
  const report = buildReport()
  const severity = getReadinessSeverity(report, 0)
  assert.equal(severity, 'critical')
})

test('readiness severity escala para critical por reincidencia', () => {
  const report = buildReport({
    categories: [
      {
        key: 'marketing',
        title: 'Marketing',
        items: [
          {
            id: 'campaigns-failed',
            label: 'Campanhas com falha',
            ok: false,
            detail: '2 campanhas',
          },
        ],
      },
    ],
  })

  const severity = getReadinessSeverity(report, 3)
  assert.equal(severity, 'critical')
})

test('fingerprint muda quando muda pendencia', () => {
  const reportA = buildReport()
  const reportB = buildReport({
    categories: [
      {
        key: 'seguranca',
        title: 'Seguranca e acesso',
        items: [
          {
            id: 'alert-webhook-url',
            label: 'ALERT_WEBHOOK_URL',
            ok: false,
            detail: 'Timeout na chamada',
          },
        ],
      },
    ],
  })

  const fpA = buildReadinessFingerprint(reportA)
  const fpB = buildReadinessFingerprint(reportB)
  assert.notEqual(fpA, fpB)
})
