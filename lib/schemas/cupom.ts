import { z } from 'zod'

export const criarCupomSchema = z
  .object({
    codigo: z
      .string()
      .min(3, 'Código deve ter ao menos 3 caracteres')
      .max(30, 'Código deve ter no máximo 30 caracteres')
      .regex(/^[A-Z0-9_\-]+$/i, 'Código deve conter apenas letras, números, hífen ou underscore')
      .transform((v) => v.toUpperCase().trim()),
    tipo: z.enum(['percentual', 'valor_fixo']),
    valor: z.number({ invalid_type_error: 'Valor inválido' }).positive('Valor deve ser positivo'),
    valor_minimo_pedido: z.number().min(0).nullable().optional(),
    max_usos: z.number().int().positive().nullable().optional(),
    ativo: z.boolean().default(true),
    data_inicio: z.string().datetime().optional(),
    data_expiracao: z.string().datetime().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.tipo === 'percentual' && data.valor > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_big,
        maximum: 100,
        type: 'number',
        inclusive: true,
        message: 'Percentual máximo é 100',
        path: ['valor'],
      })
    }
  })

export const validarCupomSchema = z.object({
  codigo: z.string().min(1, 'Código obrigatório').trim(),
  restaurante_id: z.string().uuid('restaurante_id inválido'),
  valor_pedido: z.number().min(0, 'Valor do pedido inválido'),
})

export type CriarCupomData = z.infer<typeof criarCupomSchema>
export type ValidarCupomData = z.infer<typeof validarCupomSchema>
