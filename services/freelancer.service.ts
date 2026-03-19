/**
 * services/freelancer.service.ts
 * Lógica de negócio para marketplace de freelancers.
 *
 * REGRAS ENTERPRISE:
 * - Valor do job é calculado automaticamente com base na tabela de preços
 * - Freelancers editam via painel web (sem acesso ao repositório/código)
 * - Após editar, freelancer submete para revisão → admin aprova ou solicita correção
 * - Acesso temporário é limitado a permissões granulares no banco, nunca ao Git
 */
import { createAdminClient } from '@/lib/supabase/admin'
import { logAction } from './support.service'
import type {
  Freelancer,
  FreelancerJob,
  FreelancerAccess,
  FreelancerPermission,
  JobStatus,
  ChecklistItem,
} from '@/types/support'

const db = () => createAdminClient()

// ── Tabela de Preços (auto-cálculo) ──────────────

const PRICE_TABLE: Record<string, { base: number; per_item: number; description: string }> = {
  cardapio: { base: 50, per_item: 2, description: 'Cadastro/edição de cardápio digital' },
  design: { base: 80, per_item: 5, description: 'Design de banner, logo, identidade visual' },
  configuracao: {
    base: 40,
    per_item: 0,
    description: 'Configuração de horários, delivery, pagamento',
  },
  personalizado: { base: 100, per_item: 10, description: 'Trabalho personalizado sob demanda' },
}

/**
 * Calcula automaticamente o valor do job com base no tipo e checklist.
 * Fórmula: base + (per_item × num_itens_checklist) + bônus urgência
 */
export function calculateJobValue(tipo: string, checklist: ChecklistItem[], prazo: string): number {
  const pricing = PRICE_TABLE[tipo] ?? PRICE_TABLE.personalizado
  const numItems = checklist.length
  const base = pricing.base + pricing.per_item * numItems

  // Bônus de urgência: prazo < 24h = +50%, < 48h = +25%
  const hoursUntilDeadline = (new Date(prazo).getTime() - Date.now()) / (1000 * 60 * 60)
  let urgencyMultiplier = 1.0
  if (hoursUntilDeadline < 24) urgencyMultiplier = 1.5
  else if (hoursUntilDeadline < 48) urgencyMultiplier = 1.25

  return Math.round(base * urgencyMultiplier * 100) / 100
}

// ── Freelancers CRUD ──────────────────────────────

export async function listFreelancers(filters?: {
  status?: string
  especialidade?: string
  limit?: number
  offset?: number
}) {
  let query = db()
    .from('freelancers')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.especialidade) query = query.contains('especialidades', [filters.especialidade])
  query = query.range(filters?.offset ?? 0, (filters?.offset ?? 0) + (filters?.limit ?? 50) - 1)

  const { data, count, error } = await query
  if (error) throw new Error(`Erro ao listar freelancers: ${error.message}`)
  return { data: (data ?? []) as Freelancer[], total: count ?? 0 }
}

export async function approveFreelancer(freelancerId: string, approvedBy: string) {
  const { error } = await db()
    .from('freelancers')
    .update({
      status: 'approved',
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
    })
    .eq('id', freelancerId)

  if (error) throw new Error(`Erro ao aprovar: ${error.message}`)

  await logAction({
    actor_id: approvedBy,
    actor_type: 'admin',
    action: 'freelancer.approved',
    entity: 'freelancer',
    entity_id: freelancerId,
  })
}

export async function suspendFreelancer(freelancerId: string, suspendedBy: string) {
  // Revogar acessos ativos
  await db()
    .from('freelancer_access')
    .update({ revoked_at: new Date().toISOString(), revoked_by: suspendedBy })
    .eq('freelancer_id', freelancerId)
    .is('revoked_at', null)

  const { error } = await db()
    .from('freelancers')
    .update({ status: 'suspended' })
    .eq('id', freelancerId)

  if (error) throw new Error(`Erro ao suspender: ${error.message}`)

  await logAction({
    actor_id: suspendedBy,
    actor_type: 'admin',
    action: 'freelancer.suspended',
    entity: 'freelancer',
    entity_id: freelancerId,
  })
}

// ── Jobs ──────────────────────────────────────────

export async function createJob(params: {
  restaurant_id: string
  titulo: string
  descricao: string
  tipo: string
  checklist: ChecklistItem[]
  prazo: string
  valor?: number // se não informado, é auto-calculado
  max_revisoes?: number
  created_by: string
  ticket_id?: string
}): Promise<FreelancerJob> {
  // Auto-calcula valor se não fornecido
  const valor = params.valor ?? calculateJobValue(params.tipo, params.checklist, params.prazo)

  const { data, error } = await db()
    .from('freelancer_jobs')
    .insert({
      restaurant_id: params.restaurant_id,
      titulo: params.titulo,
      descricao: params.descricao,
      tipo: params.tipo,
      checklist: params.checklist,
      prazo: params.prazo,
      valor,
      max_revisoes: params.max_revisoes ?? 2,
      created_by: params.created_by,
      ticket_id: params.ticket_id ?? null,
    })
    .select()
    .single()

  if (error) throw new Error(`Erro ao criar job: ${error.message}`)

  await logAction({
    actor_id: params.created_by,
    actor_type: 'admin',
    action: 'job.created',
    entity: 'freelancer_job',
    entity_id: data.id,
    metadata: { restaurant_id: params.restaurant_id, tipo: params.tipo, valor_calculado: valor },
  })

  return data as FreelancerJob
}

export async function assignJob(
  jobId: string,
  freelancerId: string,
  assignedBy: string,
  permissions: FreelancerPermission[] = ['edit_menu'],
  accessDurationHours: number = 48
): Promise<FreelancerAccess> {
  // Busca o job para pegar restaurant_id
  const { data: job, error: jobError } = await db()
    .from('freelancer_jobs')
    .select('restaurant_id, prazo')
    .eq('id', jobId)
    .single()

  if (jobError || !job) throw new Error('Job não encontrado')

  // Atualiza o job
  await db()
    .from('freelancer_jobs')
    .update({
      freelancer_id: freelancerId,
      status: 'assigned' as JobStatus,
      assigned_at: new Date().toISOString(),
    })
    .eq('id', jobId)

  // Cria acesso temporário
  const expiresAt = new Date(Date.now() + accessDurationHours * 60 * 60 * 1000).toISOString()

  const { data: access, error: accessError } = await db()
    .from('freelancer_access')
    .insert({
      freelancer_id: freelancerId,
      job_id: jobId,
      restaurant_id: job.restaurant_id,
      permissions,
      expires_at: expiresAt,
    })
    .select()
    .single()

  if (accessError) throw new Error(`Erro ao criar acesso: ${accessError.message}`)

  await logAction({
    actor_id: assignedBy,
    actor_type: 'admin',
    action: 'job.assigned',
    entity: 'freelancer_job',
    entity_id: jobId,
    metadata: { freelancer_id: freelancerId, permissions, expires_at: expiresAt },
  })

  return access as FreelancerAccess
}

export async function listJobs(filters?: {
  status?: string
  freelancer_id?: string
  restaurant_id?: string
  limit?: number
  offset?: number
}) {
  let query = db()
    .from('freelancer_jobs')
    .select('*, freelancers(nome), restaurants!inner(nome)', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.freelancer_id) query = query.eq('freelancer_id', filters.freelancer_id)
  if (filters?.restaurant_id) query = query.eq('restaurant_id', filters.restaurant_id)
  query = query.range(filters?.offset ?? 0, (filters?.offset ?? 0) + (filters?.limit ?? 50) - 1)

  const { data, count, error } = await query
  if (error) throw new Error(`Erro ao listar jobs: ${error.message}`)
  return { data: (data ?? []) as FreelancerJob[], total: count ?? 0 }
}

export async function completeJob(jobId: string, reviewedBy: string, rating?: number) {
  const updates: Record<string, unknown> = {
    status: 'completed',
    completed_at: new Date().toISOString(),
    reviewed_by: reviewedBy,
  }
  if (rating) updates.rating = rating

  const { data: job, error } = await db()
    .from('freelancer_jobs')
    .update(updates)
    .eq('id', jobId)
    .select('freelancer_id')
    .single()

  if (error) throw new Error(`Erro ao completar job: ${error.message}`)

  // Incrementa jobs_completed do freelancer
  if (job?.freelancer_id) {
    const { data: fl } = await db()
      .from('freelancers')
      .select('jobs_completed, rating_avg')
      .eq('id', job.freelancer_id)
      .single()

    if (fl) {
      const newCompleted = (fl.jobs_completed ?? 0) + 1
      const newRating = rating
        ? ((fl.rating_avg ?? 0) * fl.jobs_completed + rating) / newCompleted
        : fl.rating_avg

      await db()
        .from('freelancers')
        .update({ jobs_completed: newCompleted, rating_avg: newRating })
        .eq('id', job.freelancer_id)
    }
  }

  // Revogar acessos do job
  await db()
    .from('freelancer_access')
    .update({ revoked_at: new Date().toISOString(), revoked_by: reviewedBy })
    .eq('job_id', jobId)
    .is('revoked_at', null)

  await logAction({
    actor_id: reviewedBy,
    actor_type: 'admin',
    action: 'job.completed',
    entity: 'freelancer_job',
    entity_id: jobId,
    metadata: { rating },
  })
}

export async function cancelJob(jobId: string, cancelledBy: string) {
  await db().from('freelancer_jobs').update({ status: 'cancelled' }).eq('id', jobId)

  // Revogar acessos
  await db()
    .from('freelancer_access')
    .update({ revoked_at: new Date().toISOString(), revoked_by: cancelledBy })
    .eq('job_id', jobId)
    .is('revoked_at', null)

  await logAction({
    actor_id: cancelledBy,
    actor_type: 'admin',
    action: 'job.cancelled',
    entity: 'freelancer_job',
    entity_id: jobId,
  })
}

// ── Fluxo de Revisão (edit → submit → review → approve/reject) ──

/**
 * Freelancer inicia trabalho no job.
 * Muda status de 'assigned' → 'in_progress'.
 */
export async function startJob(jobId: string, freelancerId: string) {
  const { data: job } = await db()
    .from('freelancer_jobs')
    .select('freelancer_id, status')
    .eq('id', jobId)
    .single()

  if (!job) throw new Error('Job não encontrado')
  if (job.freelancer_id !== freelancerId) throw new Error('Você não está atribuído a este job')
  if (job.status !== 'assigned') throw new Error('Job não pode ser iniciado neste status')

  await db()
    .from('freelancer_jobs')
    .update({ status: 'in_progress', started_at: new Date().toISOString() })
    .eq('id', jobId)

  await logAction({
    actor_id: freelancerId,
    actor_type: 'freelancer',
    action: 'job.started',
    entity: 'freelancer_job',
    entity_id: jobId,
  })
}

/**
 * Freelancer submete o trabalho para revisão do admin.
 * Muda status de 'in_progress' → 'review'.
 * O freelancer NÃO tem acesso ao repositório — ele edita via painel web
 * (produtos, categorias, config) e depois clica "Enviar para Revisão".
 */
export async function submitForReview(
  jobId: string,
  freelancerId: string,
  checklist?: ChecklistItem[]
) {
  const { data: job } = await db()
    .from('freelancer_jobs')
    .select('freelancer_id, status, max_revisoes, revisoes_usadas')
    .eq('id', jobId)
    .single()

  if (!job) throw new Error('Job não encontrado')
  if (job.freelancer_id !== freelancerId) throw new Error('Você não está atribuído a este job')
  if (job.status !== 'in_progress') throw new Error('Job precisa estar em andamento para submeter')

  const updates: Record<string, unknown> = { status: 'review' }
  if (checklist) updates.checklist = checklist

  await db().from('freelancer_jobs').update(updates).eq('id', jobId)

  await logAction({
    actor_id: freelancerId,
    actor_type: 'freelancer',
    action: 'job.submitted_for_review',
    entity: 'freelancer_job',
    entity_id: jobId,
    metadata: { revisoes_usadas: job.revisoes_usadas },
  })
}

/**
 * Admin solicita correções, devolvendo o job ao freelancer.
 * Muda status de 'review' → 'in_progress' e incrementa revisões usadas.
 */
export async function requestRevision(jobId: string, reviewedBy: string, feedback: string) {
  const { data: job } = await db()
    .from('freelancer_jobs')
    .select('status, max_revisoes, revisoes_usadas')
    .eq('id', jobId)
    .single()

  if (!job) throw new Error('Job não encontrado')
  if (job.status !== 'review') throw new Error('Job não está em revisão')
  if (job.revisoes_usadas >= job.max_revisoes) {
    throw new Error(`Limite de ${job.max_revisoes} revisões atingido. Aprove ou cancele.`)
  }

  await db()
    .from('freelancer_jobs')
    .update({
      status: 'in_progress',
      revisoes_usadas: job.revisoes_usadas + 1,
      metadata: { last_feedback: feedback, feedback_at: new Date().toISOString() },
    })
    .eq('id', jobId)

  await logAction({
    actor_id: reviewedBy,
    actor_type: 'admin',
    action: 'job.revision_requested',
    entity: 'freelancer_job',
    entity_id: jobId,
    metadata: { feedback, revisao_numero: job.revisoes_usadas + 1 },
  })
}

/**
 * Retorna a tabela de preços para exibição no admin.
 */
export function getPriceTable() {
  return PRICE_TABLE
}
