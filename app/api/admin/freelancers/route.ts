/**
 * API: /api/admin/freelancers
 * CRUD de freelancers + jobs + acessos
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import {
  listFreelancers,
  approveFreelancer,
  suspendFreelancer,
  createJob,
  assignJob,
  listJobs,
  completeJob,
  cancelJob,
  requestRevision,
  getPriceTable,
} from '@/services/freelancer.service'
import { z } from 'zod'

// GET /api/admin/freelancers?tab=freelancers|jobs
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req, 'support')
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const url = new URL(req.url)
  const tab = url.searchParams.get('tab') ?? 'freelancers'

  if (tab === 'price_table') {
    return NextResponse.json({ prices: getPriceTable() })
  }

  if (tab === 'jobs') {
    const result = await listJobs({
      status: url.searchParams.get('status') ?? undefined,
      freelancer_id: url.searchParams.get('freelancer_id') ?? undefined,
      restaurant_id: url.searchParams.get('restaurant_id') ?? undefined,
      limit: Number(url.searchParams.get('limit')) || 50,
      offset: Number(url.searchParams.get('offset')) || 0,
    })
    return NextResponse.json(result)
  }

  const result = await listFreelancers({
    status: url.searchParams.get('status') ?? undefined,
    especialidade: url.searchParams.get('especialidade') ?? undefined,
    limit: Number(url.searchParams.get('limit')) || 50,
    offset: Number(url.searchParams.get('offset')) || 0,
  })
  return NextResponse.json(result)
}

// ── Schemas ───────────────────────────────────────

const approveSchema = z.object({
  action: z.literal('approve'),
  freelancer_id: z.string().uuid(),
})

const suspendSchema = z.object({
  action: z.literal('suspend'),
  freelancer_id: z.string().uuid(),
})

const createJobSchema = z.object({
  action: z.literal('create_job'),
  restaurant_id: z.string().uuid(),
  titulo: z.string().min(3).max(200),
  descricao: z.string().min(10).max(5000),
  tipo: z.enum(['cardapio', 'design', 'configuracao', 'personalizado']),
  checklist: z.array(z.object({ item: z.string(), done: z.boolean() })).default([]),
  prazo: z.string().datetime(),
  valor: z.number().positive().optional(),
  max_revisoes: z.number().int().min(0).max(10).default(2),
  ticket_id: z.string().uuid().optional(),
})

const assignJobSchema = z.object({
  action: z.literal('assign_job'),
  job_id: z.string().uuid(),
  freelancer_id: z.string().uuid(),
  permissions: z
    .array(z.enum(['edit_menu', 'edit_categories', 'edit_products', 'edit_config', 'view_orders']))
    .default(['edit_menu']),
  access_hours: z.number().int().min(1).max(720).default(48),
})

const completeJobSchema = z.object({
  action: z.literal('complete_job'),
  job_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5).optional(),
})

const cancelJobSchema = z.object({
  action: z.literal('cancel_job'),
  job_id: z.string().uuid(),
})

const requestRevisionSchema = z.object({
  action: z.literal('request_revision'),
  job_id: z.string().uuid(),
  feedback: z.string().min(5).max(2000),
})

// POST /api/admin/freelancers
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const action = body?.action

  if (action === 'approve') {
    const parsed = approveSchema.safeParse(body)
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    await approveFreelancer(parsed.data.freelancer_id, admin.id)
    return NextResponse.json({ ok: true })
  }

  if (action === 'suspend') {
    const parsed = suspendSchema.safeParse(body)
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    await suspendFreelancer(parsed.data.freelancer_id, admin.id)
    return NextResponse.json({ ok: true })
  }

  if (action === 'create_job') {
    const parsed = createJobSchema.safeParse(body)
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    const job = await createJob({ ...parsed.data, created_by: admin.id })
    return NextResponse.json({ job })
  }

  if (action === 'assign_job') {
    const parsed = assignJobSchema.safeParse(body)
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    const access = await assignJob(
      parsed.data.job_id,
      parsed.data.freelancer_id,
      admin.id,
      parsed.data.permissions,
      parsed.data.access_hours
    )
    return NextResponse.json({ access })
  }

  if (action === 'complete_job') {
    const parsed = completeJobSchema.safeParse(body)
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    await completeJob(parsed.data.job_id, admin.id, parsed.data.rating)
    return NextResponse.json({ ok: true })
  }

  if (action === 'cancel_job') {
    const parsed = cancelJobSchema.safeParse(body)
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    await cancelJob(parsed.data.job_id, admin.id)
    return NextResponse.json({ ok: true })
  }

  if (action === 'request_revision') {
    const parsed = requestRevisionSchema.safeParse(body)
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    await requestRevision(parsed.data.job_id, admin.id, parsed.data.feedback)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
}
