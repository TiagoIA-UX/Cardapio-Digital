import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const configSchema = z.object({
  ativo: z.boolean().default(true),
  pontos_por_real: z.number().min(0.01).default(1),
  real_por_ponto: z.number().min(0.001).default(0.1),
  resgate_minimo: z.number().int().min(1).default(100),
  validade_dias: z.number().int().min(0).default(365),
})

async function getRestaurantId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: rest } = await supabase
    .from('restaurants')
    .select('id')
    .eq('user_id', user.id)
    .single()

  return rest?.id ?? null
}

// GET /api/loyalty — retorna config + contas do restaurante
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const restaurantId = await getRestaurantId(supabase)
  if (!restaurantId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const perPage = Math.min(50, parseInt(searchParams.get('per_page') ?? '20'))
  const offset = (page - 1) * perPage

  const admin = createAdminClient()

  const [configResult, accountsResult] = await Promise.all([
    admin
      .from('loyalty_config')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .maybeSingle(),
    admin
      .from('loyalty_accounts')
      .select('*', { count: 'exact' })
      .eq('restaurant_id', restaurantId)
      .order('pontos_total', { ascending: false })
      .range(offset, offset + perPage - 1),
  ])

  return NextResponse.json({
    config: configResult.data,
    accounts: accountsResult.data ?? [],
    total: accountsResult.count ?? 0,
    page,
    perPage,
  })
}

// POST /api/loyalty — upsert config do programa de fidelidade
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const restaurantId = await getRestaurantId(supabase)
  if (!restaurantId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const result = configSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: result.error.flatten() },
      { status: 400 }
    )
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('loyalty_config')
    .upsert(
      { ...result.data, restaurant_id: restaurantId, updated_at: new Date().toISOString() },
      { onConflict: 'restaurant_id' }
    )
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Erro ao salvar configuração' }, { status: 500 })
  }

  return NextResponse.json({ config: data })
}
