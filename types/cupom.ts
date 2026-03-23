export type TipoCupom = 'percentual' | 'valor_fixo'

export interface Cupom {
  id: string
  restaurante_id: string
  codigo: string
  tipo: TipoCupom
  valor: number
  valor_minimo_pedido: number | null
  max_usos: number | null
  usos_atuais: number
  ativo: boolean
  data_inicio: string
  data_expiracao: string | null
  created_at: string
  updated_at: string
}

export interface CriarCupomInput {
  codigo: string
  tipo: TipoCupom
  valor: number
  valor_minimo_pedido?: number | null
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
  cupom_id?: string
  codigo?: string
  tipo?: TipoCupom
  valor_desconto?: number
  erro?: string
}
