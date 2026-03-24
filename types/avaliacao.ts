// =====================================================
// types/avaliacao.ts — Sistema de Avaliações / Reviews
// =====================================================

export interface Avaliacao {
  id: string
  restaurante_id: string
  pedido_id: string | null
  cliente_nome: string
  cliente_email: string | null
  nota: 1 | 2 | 3 | 4 | 5
  comentario: string | null
  resposta: string | null
  respondido_em: string | null
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface CriarAvaliacaoInput {
  restaurante_id: string
  pedido_id?: string
  cliente_nome: string
  cliente_email?: string
  nota: 1 | 2 | 3 | 4 | 5
  comentario?: string
}

export interface ResponderAvaliacaoInput {
  resposta: string
}

export interface AvaliacaoResumo {
  restaurante_id: string
  total_avaliacoes: number
  nota_media: number
  notas_5: number
  notas_4: number
  notas_3: number
  notas_2: number
  notas_1: number
}
