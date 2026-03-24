import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const couponSchema = z.object({
  code: z.string().min(1).max(30).toUpperCase(),
  discount_type: z.enum(['percentage', 'fixed']),
  discount_value: z.number().min(0.01),
  min_purchase: z.number().min(0).default(0),
  max_uses: z.number().int().min(1).nullable().default(null),
  expires_at: z.string().datetime().nullable().default(null),
  is_active: z.boolean().default(true),
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

// GET /api/cupons — lista cupons do restaurante autenticado
export async function GET() {
  const supabase = await createClient()
  const restaurantId = await getRestaurantId(supabase)
  if (!restaurantId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('coupons')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Erro ao buscar cupons' }, { status: 500 })
  }

  return NextResponse.json({ coupons: data })
}

// POST /api/cupons — cria novo cupom para o restaurante autenticado
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const restaurantId = await getRestaurantId(supabase)
  if (!restaurantId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const result = couponSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: result.error.flatten() },
      { status: 400 }
    )
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('coupons')
    .insert({ ...result.data, restaurant_id: restaurantId })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Já existe um cupom com esse código' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Erro ao criar cupom' }, { status: 500 })
  }

  return NextResponse.json({ coupon: data }, { status: 201 })
}

// PATCH /api/cupons?id=... — atualiza cupom
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const restaurantId = await getRestaurantId(supabase)
  if (!restaurantId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })
  }

  const body = await request.json()
  const result = couponSchema.partial().safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('coupons')
    .update(result.data)
    .eq('id', id)
    .eq('restaurant_id', restaurantId)
    .select()
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Cupom não encontrado ou erro ao atualizar' }, { status: 404 })
  }

  return NextResponse.json({ coupon: data })
}

// DELETE /api/cupons?id=... — remove cupom
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const restaurantId = await getRestaurantId(supabase)
  if (!restaurantId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('coupons')
    .delete()
    .eq('id', id)
    .eq('restaurant_id', restaurantId)

  if (error) {
    return NextResponse.json({ error: 'Erro ao deletar cupom' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
