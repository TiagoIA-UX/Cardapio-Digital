import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'

// Cliente do Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
  options: { timeout: 5000 }
})

export const mercadopago = {
  preference: new Preference(client),
  payment: new Payment(client)
}

// Preços
export const PRICES = {
  PIX: {
    amount: 497,
    description: 'Site com Cardápio Digital - PIX à vista',
    discount: 100
  },
  CARD: {
    amount: 597,
    description: 'Site com Cardápio Digital - Cartão',
    installments: 6, // 6x sem juros
    installmentAmount: 99.50
  }
}

// Criar preferência de pagamento
export async function createPreference(data: {
  restaurantId: string
  restaurantName: string
  userEmail: string
  paymentMethod: 'pix' | 'card'
}) {
  const isCard = data.paymentMethod === 'card'
  const price = isCard ? PRICES.CARD : PRICES.PIX
  
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://card-pio-digital-seven.vercel.app'
  
  const preference = await mercadopago.preference.create({
    body: {
      items: [
        {
          id: data.restaurantId,
          title: price.description,
          description: `Cardápio Digital para ${data.restaurantName}`,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: price.amount,
        }
      ],
      payer: {
        email: data.userEmail
      },
      payment_methods: isCard ? {
        installments: PRICES.CARD.installments,
        default_installments: PRICES.CARD.installments
      } : {
        excluded_payment_types: [
          { id: 'credit_card' },
          { id: 'debit_card' }
        ]
      },
      back_urls: {
        success: `${baseUrl}/pagamento/sucesso`,
        failure: `${baseUrl}/pagamento/erro`,
        pending: `${baseUrl}/pagamento/pendente`
      },
      auto_return: 'approved',
      external_reference: data.restaurantId,
      notification_url: `${baseUrl}/api/webhook/mercadopago`,
      statement_descriptor: 'CARDAPIO DIGITAL'
    }
  })

  return preference
}
