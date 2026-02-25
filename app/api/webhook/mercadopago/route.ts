import { NextRequest, NextResponse } from 'next/server'
import { mercadopago, PRICES } from '@/lib/mercadopago'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('Webhook recebido:', JSON.stringify(body, null, 2))

    // Mercado Pago envia diferentes tipos de notificação
    if (body.type === 'payment') {
      const paymentId = body.data?.id

      if (!paymentId) {
        return NextResponse.json({ received: true })
      }

      // Buscar detalhes do pagamento
      const payment = await mercadopago.payment.get({ id: paymentId })
      
      console.log('Pagamento:', JSON.stringify(payment, null, 2))

      const restaurantId = payment.external_reference
      const status = payment.status

      if (!restaurantId) {
        console.log('Sem external_reference no pagamento')
        return NextResponse.json({ received: true })
      }

      // Mapear status do Mercado Pago
      let statusPagamento = 'pendente'
      if (status === 'approved') {
        statusPagamento = 'ativo'
      } else if (status === 'pending' || status === 'in_process') {
        statusPagamento = 'aguardando'
      } else if (status === 'rejected' || status === 'cancelled') {
        statusPagamento = 'cancelado'
      }

      // Atualizar restaurante
      const updateData: Record<string, unknown> = {
        status_pagamento: statusPagamento
      }

      if (status === 'approved') {
        updateData.plano = 'profissional'
        updateData.valor_pago = payment.transaction_amount
        updateData.data_pagamento = new Date().toISOString()
      }

      const { error } = await supabase
        .from('restaurants')
        .update(updateData)
        .eq('id', restaurantId)

      if (error) {
        console.error('Erro ao atualizar restaurante:', error)
      } else {
        console.log(`Restaurante ${restaurantId} atualizado para ${statusPagamento}`)
      }
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Erro no webhook:', error)
    // Sempre retornar 200 para o Mercado Pago não reenviar
    return NextResponse.json({ received: true })
  }
}

// Mercado Pago também pode enviar GET para verificar
export async function GET() {
  return NextResponse.json({ status: 'ok' })
}
