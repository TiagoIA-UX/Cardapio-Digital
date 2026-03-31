import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateImage } from '@/lib/ai-image-generator'
import { checkRateLimit, getRateLimitIdentifier } from '@/lib/rate-limit'

const GenerateSchema = z.object({
  prompt: z.string().min(3).max(500),
  style: z
    .enum(['food', 'packshot', 'lifestyle', 'abstract', 'product', 'logo'])
    .optional()
    .default('food'),
  width: z.number().int().min(256).max(1024).optional().default(1024),
  height: z.number().int().min(256).max(1024).optional().default(1024),
})

export async function POST(request: NextRequest) {
  const identifier = getRateLimitIdentifier(request)
  const rateLimit = await checkRateLimit(identifier, { limit: 10, windowMs: 60_000 })

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Muitas requisições. Aguarde um momento.', retryAfter: Math.ceil(rateLimit.resetIn / 1000) },
      { status: 429, headers: { 'Retry-After': Math.ceil(rateLimit.resetIn / 1000).toString(), ...rateLimit.headers } }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = GenerateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { prompt, style, width, height } = parsed.data

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = createAdminClient()

  if (user) {
    // Usuário autenticado: verificar e consumir crédito

    // Garantir registro de créditos existe (dar créditos gratuitos se ainda não recebeu)
    const { data: creditsRow } = await admin
      .from('ai_image_credits')
      .select('credits_available')
      .eq('user_id', user.id)
      .single()

    if (!creditsRow) {
      // Primeiro acesso: dar créditos gratuitos via função RPC segura
      await admin.rpc('give_free_ai_image_credits', { p_user_id: user.id })
    }

    // Verificar saldo atualizado
    const { data: credits } = await admin
      .from('ai_image_credits')
      .select('credits_available')
      .eq('user_id', user.id)
      .single()

    if (!credits || credits.credits_available < 1) {
      return NextResponse.json(
        {
          error: 'Créditos insuficientes',
          code: 'INSUFFICIENT_CREDITS',
          message: 'Você não tem créditos suficientes. Adquira um pacote para continuar.',
        },
        { status: 402 }
      )
    }

    // Consumir crédito via função segura no banco
    const { data: consumed, error: consumeError } = await admin.rpc('consume_ai_image_credit', {
      p_user_id: user.id,
      p_amount: 1,
    })

    if (consumeError || consumed === false) {
      return NextResponse.json(
        { error: 'Não foi possível consumir crédito. Tente novamente.' },
        { status: 500 }
      )
    }
  }
  // Usuários não autenticados não consomem créditos mas têm rate limit mais restrito (10 req/min por IP)

  // Gerar imagem
  let result
  try {
    result = await generateImage({ prompt, style, width, height })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao gerar imagem'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  // Salvar geração no banco (apenas para usuários autenticados)
  if (user) {
    await admin.from('ai_image_generations').insert({
      user_id: user.id,
      prompt,
      translated_prompt: result.translatedPrompt,
      style,
      image_url: result.imageUrl,
      provider: result.provider,
      width: result.width,
      height: result.height,
      credits_charged: 1,
    })
  }

  return NextResponse.json(
    {
      success: true,
      imageUrl: result.imageUrl,
      provider: result.provider,
      width: result.width,
      height: result.height,
    },
    { headers: rateLimit.headers }
  )
}
