import { z } from 'zod'

export const criarAvaliacaoSchema = z.object({
  restaurante_id: z.string().uuid('restaurante_id inválido'),
  pedido_id: z.string().uuid().optional(),
  cliente_nome: z.string().min(2, 'Nome deve ter ao menos 2 caracteres').max(100),
  cliente_email: z.string().email('E-mail inválido').optional(),
  nota: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
  comentario: z.string().max(1000).optional(),
})

export const responderAvaliacaoSchema = z.object({
  resposta: z
    .string()
    .min(1, 'Resposta não pode ser vazia')
    .max(500, 'Resposta deve ter no máximo 500 caracteres'),
})

export type CriarAvaliacaoSchema = z.infer<typeof criarAvaliacaoSchema>
export type ResponderAvaliacaoSchema = z.infer<typeof responderAvaliacaoSchema>
