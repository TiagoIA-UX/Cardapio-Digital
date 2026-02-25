import { NextRequest, NextResponse } from 'next/server'
import { createPreference } from '@/lib/mercadopago'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { restaurantId, paymentMethod } = body

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'restaurantId é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar dados do restaurante
    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .select('id, nome, user_id')
      .eq('id', restaurantId)
      .single()

    if (error || !restaurant) {
      return NextResponse.json(
        { error: 'Restaurante não encontrado' },
        { status: 404 }
      )
    }

    // Buscar email do usuário
    const { data: userData } = await supabase.auth.admin.getUserById(restaurant.user_id)

    const preference = await createPreference({
      restaurantId: restaurant.id,
      restaurantName: restaurant.nome,
      userEmail: userData?.user?.email || 'cliente@email.com',
      paymentMethod: paymentMethod || 'card'
    })

    // Atualizar status para aguardando pagamento
    await supabase
      .from('restaurants')
      .update({ status_pagamento: 'aguardando' })
      .eq('id', restaurantId)

    return NextResponse.json({
      preferenceId: preference.id,
      initPoint: preference.init_point,
      sandboxInitPoint: preference.sandbox_init_point
    })

  } catch (error) {
    console.error('Erro ao criar preferência:', error)
    return NextResponse.json(
      { error: 'Erro ao processar pagamento' },
      { status: 500 }
    )
  }
}
