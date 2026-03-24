import { z } from 'zod'

export const criarCupomSchema = z.object({
  restaurante_id: z.string().uuid('restaurante_id inválido'),
  codigo: z
    .string()
    .min(3, 'Código deve ter ao menos 3 caracteres')
    .max(30, 'Código deve ter no máximo 30 caracteres')
    .regex(/^[A-Z0-9_-]+$/i, 'Código deve conter apenas letras, números, _ ou -')
    .transform((v) => v.toUpperCase().trim()),
  tipo: z.enum(['percentual', 'valor_fixo'], {
    errorMap: () => ({ message: 'Tipo deve ser "percentual" ou "valor_fixo"' }),
  }),
  valor: z
    .number({ invalid_type_error: 'Valor deve ser um número' })
    .positive('Valor deve ser maior que zero'),
  valor_minimo_pedido: z.number().min(0).optional().default(0),
  max_usos: z.number().int().positive().nullable().optional(),
  data_inicio: z.string().datetime({ offset: true }).optional(),
  data_expiracao: z.string().datetime({ offset: true }).nullable().optional(),
})

export const atualizarCupomSchema = z.object({
  tipo: z.enum(['percentual', 'valor_fixo']).optional(),
  valor: z.number().positive().optional(),
  valor_minimo_pedido: z.number().min(0).optional(),
  max_usos: z.number().int().positive().nullable().optional(),
  ativo: z.boolean().optional(),
  data_inicio: z.string().datetime({ offset: true }).optional(),
  data_expiracao: z.string().datetime({ offset: true }).nullable().optional(),
})

export const validarCupomSchema = z.object({
  codigo: z.string().min(1, 'Código obrigatório').transform((v) => v.toUpperCase().trim()),
  restaurante_id: z.string().uuid('restaurante_id inválido'),
  valor_pedido: z
    .number({ invalid_type_error: 'valor_pedido deve ser um número' })
    .min(0, 'valor_pedido não pode ser negativo'),
})

export type CriarCupomSchema = z.infer<typeof criarCupomSchema>
export type AtualizarCupomSchema = z.infer<typeof atualizarCupomSchema>
export type ValidarCupomSchema = z.infer<typeof validarCupomSchema>
