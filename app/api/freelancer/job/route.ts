/**
 * API: /api/freelancer/job
 * Endpoints para o freelancer gerenciar seus jobs.
 * O freelancer edita via painel web (sem acesso ao repositório) e submete para revisão.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { startJob, submitForReview } from '@/services/freelancer.service'
import { z } from 'zod'

async function getFreelancer(userId: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('freelancers')
    .select('id, status')
    .eq('user_id', userId)
    .single()
  return data
}

// GET /api/freelancer/job — Lista jobs do freelancer
export async function GET(req: NextRequest) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const freelancer = await getFreelancer(user.id)
  if (!freelancer) return NextResponse.json({ error: 'Não é freelancer' }, { status: 403 })

  const admin = createAdminClient()
  const { data: jobs } = await admin
    .from('freelancer_jobs')
    .select('*, restaurants(nome)')
    .eq('freelancer_id', freelancer.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ jobs: jobs ?? [] })
}

const startSchema = z.object({
  action: z.literal('start'),
  job_id: z.string().uuid(),
})

const submitSchema = z.object({
  action: z.literal('submit_review'),
  job_id: z.string().uuid(),
  checklist: z.array(z.object({ item: z.string(), done: z.boolean() })).optional(),
})

// POST /api/freelancer/job — Ações: start, submit_review
export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const freelancer = await getFreelancer(user.id)
  if (!freelancer) return NextResponse.json({ error: 'Não é freelancer' }, { status: 403 })
  if (freelancer.status !== 'approved' && freelancer.status !== 'active') {
    return NextResponse.json({ error: 'Freelancer não aprovado' }, { status: 403 })
  }

  const body = await req.json()

  if (body?.action === 'start') {
    const parsed = startSchema.safeParse(body)
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    await startJob(parsed.data.job_id, freelancer.id)
    return NextResponse.json({ ok: true })
  }

  if (body?.action === 'submit_review') {
    const parsed = submitSchema.safeParse(body)
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    await submitForReview(parsed.data.job_id, freelancer.id, parsed.data.checklist)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
}
