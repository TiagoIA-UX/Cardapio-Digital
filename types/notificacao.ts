// =====================================================
// types/notificacao.ts — Tipos de notificações transacionais
// =====================================================

export type TipoNotificacao =
  | 'pedido_recebido'
  | 'pedido_confirmado'
  | 'pedido_em_preparo'
  | 'pedido_saiu_entrega'
  | 'pedido_entregue'
  | 'pedido_cancelado'
  | 'cupom_criado'
  | 'avaliacao_recebida'
  | 'fidelidade_resgate'

export interface NotificacaoConfig {
  tipo: TipoNotificacao
  destinatario_email: string
  destinatario_nome?: string
  assunto: string
  dados: Record<string, string | number | boolean | null>
}

export interface EmailTemplate {
  assunto: string
  html: string
  texto: string
}
