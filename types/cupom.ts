// =====================================================
// types/cupom.ts — Sistema de Cupons do Operador
// =====================================================

export type CupomTipo = 'percentual' | 'valor_fixo'

export interface Cupom {
  id: string
  restaurante_id: string
  codigo: string
  tipo: CupomTipo
  valor: number
  valor_minimo_pedido: number
  max_usos: number | null
  usos_atuais: number
  ativo: boolean
  data_inicio: string
  data_expiracao: string | null
  created_at: string
  updated_at: string
}

export interface CriarCupomInput {
  restaurante_id: string
  codigo: string
  tipo: CupomTipo
  valor: number
  valor_minimo_pedido?: number
  max_usos?: number | null
  data_inicio?: string
  data_expiracao?: string | null
}

export interface AtualizarCupomInput {
  tipo?: CupomTipo
  valor?: number
  valor_minimo_pedido?: number
  max_usos?: number | null
  ativo?: boolean
  data_inicio?: string
  data_expiracao?: string | null
}

export interface ValidarCupomInput {
  codigo: string
  restaurante_id: string
  valor_pedido: number
}

export interface ValidarCupomResponse {
  valido: boolean
  desconto: number
  mensagem: string
  cupom?: Pick<Cupom, 'id' | 'codigo' | 'tipo' | 'valor'>
}
