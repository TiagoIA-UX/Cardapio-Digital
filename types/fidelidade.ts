// =====================================================
// types/fidelidade.ts — Programa de Fidelidade
// =====================================================

export interface FidelidadeConfig {
  id: string
  restaurante_id: string
  ativo: boolean
  pontos_por_real: number
  compras_para_recompensa: number
  recompensa_valor: number
  recompensa_percentual: number
  validade_dias: number | null
  descricao: string | null
  created_at: string
  updated_at: string
}

export interface FidelidadeCliente {
  id: string
  restaurante_id: string
  cliente_email: string
  cliente_nome: string | null
  pontos_saldo: number
  compras_total: number
  compras_ciclo: number
  ultima_compra: string | null
  created_at: string
  updated_at: string
}

export type FidelidadeTipoTransacao = 'acumulo' | 'resgate' | 'expiracao' | 'ajuste'

export interface FidelidadeTransacao {
  id: string
  restaurante_id: string
  cliente_email: string
  tipo: FidelidadeTipoTransacao
  pontos: number
  compras: number
  pedido_id: string | null
  descricao: string | null
  created_at: string
}

export interface CriarFidelidadeConfigInput {
  restaurante_id: string
  ativo?: boolean
  pontos_por_real?: number
  compras_para_recompensa?: number
  recompensa_valor?: number
  recompensa_percentual?: number
  validade_dias?: number | null
  descricao?: string | null
}

export interface ResgatarRecompensaInput {
  restaurante_id: string
  cliente_email: string
  pedido_id?: string
}

export interface ResgatarRecompensaResponse {
  sucesso: boolean
  mensagem: string
  desconto: number
  pontos_usados: number
  saldo_anterior: number
  saldo_atual: number
}
