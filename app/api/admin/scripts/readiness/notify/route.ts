import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/domains/auth/admin-auth'
import { notify } from '@/lib/shared/notifications'
import {
  buildReadinessFingerprint,
  buildReadinessAlertBody,
  countRecentAttentionSnapshots,
  getScriptsReadinessReport,
  getReadinessSeverity,
  saveReadinessSnapshot,
} from '@/lib/domains/ops/scripts-readiness'

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req, 'admin')
  if (!admin) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  const report = await getScriptsReadinessReport()
  const recentAttentionSnapshots = await countRecentAttentionSnapshots(72)
  const severity = getReadinessSeverity(report, recentAttentionSnapshots)
  const fingerprint = buildReadinessFingerprint(report)
  const hasAttention = report.summary.attention > 0

  await saveReadinessSnapshot({
    report,
    severity,
    fingerprint,
    source: 'admin',
  })

  await notify({
    severity,
    channel: 'system',
    title: hasAttention ? 'Scripts essenciais com pendencias' : 'Scripts essenciais saudaveis',
    body: buildReadinessAlertBody(report),
    metadata: {
      source: 'admin/scripts/readiness/notify',
      actorId: admin.id,
      actorRole: admin.role,
      summary: report.summary,
      severity,
      fingerprint,
      recentAttentionSnapshots,
    },
    emailAdmin: hasAttention,
  })

  return NextResponse.json({
    success: true,
    sentToForgeOps: hasAttention,
    summary: report.summary,
    severity,
    fingerprint,
  })
}
