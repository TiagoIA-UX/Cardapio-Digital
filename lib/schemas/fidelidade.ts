import { z } from 'zod'

export const criarFidelidadeConfigSchema = z.object({
  restaurante_id: z.string().uuid('restaurante_id inválido'),
  ativo: z.boolean().optional().default(true),
  pontos_por_real: z.number().min(0).optional().default(1),
  compras_para_recompensa: z.number().int().positive().optional().default(10),
  recompensa_valor: z.number().min(0).optional().default(0),
  recompensa_percentual: z.number().min(0).max(100).optional().default(0),
  validade_dias: z.number().int().positive().nullable().optional(),
  descricao: z.string().max(500).nullable().optional(),
})

export const atualizarFidelidadeConfigSchema = criarFidelidadeConfigSchema
  .omit({ restaurante_id: true })
  .partial()

export const resgatarRecompensaSchema = z.object({
  restaurante_id: z.string().uuid('restaurante_id inválido'),
  cliente_email: z.string().email('E-mail inválido'),
  pedido_id: z.string().uuid().optional(),
})

export const consultarSaldoSchema = z.object({
  restaurante_id: z.string().uuid('restaurante_id inválido'),
  cliente_email: z.string().email('E-mail inválido'),
})

export type CriarFidelidadeConfigSchema = z.infer<typeof criarFidelidadeConfigSchema>
export type AtualizarFidelidadeConfigSchema = z.infer<typeof atualizarFidelidadeConfigSchema>
export type ResgatarRecompensaSchema = z.infer<typeof resgatarRecompensaSchema>
export type ConsultarSaldoSchema = z.infer<typeof consultarSaldoSchema>
