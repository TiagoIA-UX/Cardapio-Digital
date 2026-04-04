/**
 * GET /api/admin/agents
 *
 * Retorna tarefas e conhecimento dos agentes ZAEA.
 * Autenticação: sessão de admin (requireAdmin).
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { listTasks, getKnowledge } from '@/lib/orchestrator'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const agent = searchParams.get('agent') ?? undefined
  const status = searchParams.get('status') ?? undefined
  const hoursBack = Number(searchParams.get('hours') ?? '24')
  const knowledgeQuery = searchParams.get('knowledge') ?? undefined

  const [tasks, knowledge] = await Promise.all([
    listTasks({ agent, status, hoursBack }),
    getKnowledge(knowledgeQuery),
  ])

  const stats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    running: tasks.filter((t) => t.status === 'running').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
    failed: tasks.filter((t) => t.status === 'failed').length,
    escalated: tasks.filter((t) => t.status === 'escalated').length,
  }

  return NextResponse.json({ tasks, knowledge, stats })
}
