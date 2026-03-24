// =====================================================
// types/analytics.ts — Dashboard Analytics do Operador
// =====================================================

export interface AnalyticsResumo {
  restaurant_id: string
  total_pedidos: number
  receita_total: number
  ticket_medio: number
  pedidos_hoje: number
  pedidos_semana: number
  pedidos_mes: number
  receita_mes: number
}

export interface ProdutoMaisVendido {
  produto_nome: string
  quantidade: number
  receita: number
}

export interface PedidoPorHora {
  hora: number
  total: number
}
