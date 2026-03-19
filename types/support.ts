// =====================================================
// TIPOS — Sistema de Suporte + Freelancers + Penalidades
// =====================================================

// ── Suporte ────────────────────────────────────────

export type TicketPriority = 'critical' | 'operational' | 'low'

export type TicketCategory =
  | 'erro_sistema'
  | 'pagamento'
  | 'pedido_falhando'
  | 'cardapio'
  | 'configuracao'
  | 'duvida'
  | 'geral'
  | 'sugestao'
  | 'feedback'

export type TicketStatus =
  | 'open'
  | 'in_progress'
  | 'waiting_customer'
  | 'escalated'
  | 'resolved'
  | 'closed'

export type AssignedType = 'affiliate' | 'admin' | 'freelancer'

export interface SupportTicket {
  id: string
  restaurant_id: string
  opened_by: string
  assigned_to: string | null
  assigned_type: AssignedType
  priority: TicketPriority
  category: TicketCategory
  status: TicketStatus
  subject: string
  sla_deadline: string | null
  first_response_at: string | null
  resolved_at: string | null
  escalated_at: string | null
  escalated_reason: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  // Joins
  restaurant_name?: string
  assigned_name?: string
  messages_count?: number
}

export type MessageSenderType = 'customer' | 'affiliate' | 'admin' | 'system'

export interface SupportMessage {
  id: string
  ticket_id: string
  sender_id: string | null
  sender_type: MessageSenderType
  content: string
  metadata: Record<string, unknown>
  created_at: string
  // Joins
  sender_name?: string
}

// Categorias críticas → vão direto para admin
export const CRITICAL_CATEGORIES: TicketCategory[] = [
  'erro_sistema',
  'pagamento',
  'pedido_falhando',
]

// SLA em milissegundos (30 minutos)
export const SLA_TIMEOUT_MS = 30 * 60 * 1000

// ── Penalidades ────────────────────────────────────

export type PenaltyType =
  | 'warning'
  | 'commission_reduction'
  | 'client_loss'
  | 'suspension'
  | 'manual'

export interface AffiliatePenalty {
  id: string
  affiliate_id: string
  ticket_id: string | null
  tipo: PenaltyType
  strike_number: number
  descricao: string
  applied_by: string | null
  reverted_at: string | null
  reverted_by: string | null
  created_at: string
  // Joins
  affiliate_name?: string
  ticket_subject?: string
}

// ── Freelancers ────────────────────────────────────

export type FreelancerStatus = 'pending' | 'approved' | 'active' | 'suspended' | 'blocked'

export type FreelancerSpecialty = 'cardapio' | 'design' | 'configuracao' | 'personalizado'

export interface Freelancer {
  id: string
  user_id: string
  nome: string
  email: string
  whatsapp: string | null
  especialidades: FreelancerSpecialty[]
  portfolio_url: string | null
  avatar_url: string | null
  cidade: string | null
  estado: string | null
  rating_avg: number
  jobs_completed: number
  status: FreelancerStatus
  approved_by: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
}

// ── Jobs ───────────────────────────────────────────

export type JobType = 'cardapio' | 'design' | 'configuracao' | 'personalizado'
export type JobStatus = 'open' | 'assigned' | 'in_progress' | 'review' | 'completed' | 'cancelled'

export interface ChecklistItem {
  item: string
  done: boolean
}

export interface FreelancerJob {
  id: string
  freelancer_id: string | null
  restaurant_id: string
  ticket_id: string | null
  titulo: string
  descricao: string
  checklist: ChecklistItem[]
  tipo: JobType
  status: JobStatus
  valor: number | null
  prazo: string
  max_revisoes: number
  revisoes_usadas: number
  assigned_at: string | null
  started_at: string | null
  completed_at: string | null
  reviewed_by: string | null
  rating: number | null
  created_by: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  // Joins
  freelancer_name?: string
  restaurant_name?: string
}

// ── Acessos temporários ────────────────────────────

export type FreelancerPermission =
  | 'edit_menu'
  | 'edit_categories'
  | 'edit_products'
  | 'edit_config'
  | 'view_orders'

export interface FreelancerAccess {
  id: string
  freelancer_id: string
  job_id: string
  restaurant_id: string
  permissions: FreelancerPermission[]
  expires_at: string
  revoked_at: string | null
  revoked_by: string | null
  created_at: string
}

// ── System Logs ────────────────────────────────────

export type ActorType = 'admin' | 'affiliate' | 'freelancer' | 'customer' | 'system' | 'cron'

export interface SystemLog {
  id: string
  actor_id: string | null
  actor_type: ActorType
  action: string
  entity: string
  entity_id: string | null
  metadata: Record<string, unknown>
  ip_address: string | null
  created_at: string
}

// ── Affiliate estendido (com strikes) ──────────────

export interface AffiliateWithStrikes {
  id: string
  user_id: string
  code: string
  nome: string
  email?: string
  status: string
  tier: string
  commission_rate: number
  strikes: number
  last_response_at: string | null
  cidade: string | null
  estado: string | null
  created_at: string
  // Computed
  total_referrals?: number
  active_referrals?: number
  pending_penalties?: number
}
