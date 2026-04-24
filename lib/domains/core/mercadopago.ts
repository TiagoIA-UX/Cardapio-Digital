import { MercadoPagoConfig, Preference, Payment, PreApproval } from 'mercadopago'
import { COMPANY_NAME, COMPANY_PAYMENT_DESCRIPTOR, PRODUCT_NAME } from '@/lib/shared/brand'
import { isServerSandboxMode } from '@/lib/domains/core/payment-mode'
import { getSiteUrl } from '@/lib/shared/site-url'

interface MercadoPagoOwnerIdentity {
  ownerId: string
  nickname: string | null
  email: string | null
}

let mercadoPagoOwnerIdentityPromise: Promise<MercadoPagoOwnerIdentity> | null = null

function readEnvValue(variableNames: string[], label: string) {
  for (const variableName of variableNames) {
    const value = process.env[variableName]?.trim()
    if (value) {
      return value
    }
  }

  throw new Error(`Credencial do Mercado Pago ausente: ${label}`)
}

export function getMercadoPagoAccessToken() {
  if (!isServerSandboxMode()) {
    return readEnvValue(
      ['MERCADO_PAGO_ACCESS_TOKEN', 'MP_ACCESS_TOKEN'],
      'MERCADO_PAGO_ACCESS_TOKEN'
    )
  }

  return readEnvValue(
    ['MERCADO_PAGO_TEST_ACCESS_TOKEN', 'MERCADO_PAGO_ACCESS_TOKEN', 'MP_ACCESS_TOKEN'],
    'MERCADO_PAGO_TEST_ACCESS_TOKEN'
  )
}

export function getMercadoPagoPublicKey() {
  if (!isServerSandboxMode()) {
    return readEnvValue(
      ['NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY', 'MERCADO_PAGO_PUBLIC_KEY'],
      'NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY'
    )
  }

  return readEnvValue(
    [
      'NEXT_PUBLIC_MERCADO_PAGO_TEST_PUBLIC_KEY',
      'MERCADO_PAGO_TEST_PUBLIC_KEY',
      'NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY',
      'MERCADO_PAGO_PUBLIC_KEY',
    ],
    'NEXT_PUBLIC_MERCADO_PAGO_TEST_PUBLIC_KEY'
  )
}

export function getMercadoPagoTestAccounts() {
  return {
    sellerId: process.env.MERCADO_PAGO_TEST_SELLER_ID?.trim() || '',
    buyerId: process.env.MERCADO_PAGO_TEST_BUYER_ID?.trim() || '',
  }
}

function getConfiguredMercadoPagoSellerId() {
  if (!isServerSandboxMode()) {
    return readEnvValue(['MERCADO_PAGO_SELLER_ID'], 'MERCADO_PAGO_SELLER_ID')
  }
  return readEnvValue(
    ['MERCADO_PAGO_TEST_SELLER_ID', 'MERCADO_PAGO_SELLER_ID'],
    'MERCADO_PAGO_TEST_SELLER_ID'
  )
}

async function fetchMercadoPagoOwnerIdentity(): Promise<MercadoPagoOwnerIdentity> {
  const response = await fetch('https://api.mercadopago.com/users/me', {
    headers: {
      Authorization: `Bearer ${getMercadoPagoAccessToken()}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`mercadopago_identity_check_failed:${response.status}:${errorText}`)
  }

  const body = (await response.json()) as {
    id?: string | number
    nickname?: string | null
    email?: string | null
  }

  if (body.id === undefined || body.id === null || String(body.id).trim() === '') {
    throw new Error('mercadopago_identity_check_failed:missing_owner_id')
  }

  return {
    ownerId: String(body.id).trim(),
    nickname: typeof body.nickname === 'string' ? body.nickname : null,
    email: typeof body.email === 'string' ? body.email : null,
  }
}

export async function getMercadoPagoOwnerIdentity() {
  if (!mercadoPagoOwnerIdentityPromise) {
    mercadoPagoOwnerIdentityPromise = fetchMercadoPagoOwnerIdentity().catch((error) => {
      mercadoPagoOwnerIdentityPromise = null
      throw error
    })
  }

  return mercadoPagoOwnerIdentityPromise
}

export async function assertMercadoPagoTokenMatchesConfiguredSeller() {
  const configuredSellerId = getConfiguredMercadoPagoSellerId()
  const owner = await getMercadoPagoOwnerIdentity()

  if (owner.ownerId !== configuredSellerId) {
    throw new Error(
      `mercadopago_identity_mismatch:owner=${owner.ownerId}:configuredSeller=${configuredSellerId}`
    )
  }

  return {
    ...owner,
    configuredSellerId,
  }
}

export async function getValidatedMercadoPagoAccessToken() {
  await assertMercadoPagoTokenMatchesConfiguredSeller()
  return getMercadoPagoAccessToken()
}

export function getMercadoPagoEnvironment() {
  return isServerSandboxMode() ? 'sandbox' : 'production'
}

export function createMercadoPagoClient(timeout = 5000) {
  return new MercadoPagoConfig({
    accessToken: getMercadoPagoAccessToken(),
    options: { timeout },
  })
}

export function createMercadoPagoPreferenceClient(timeout = 5000) {
  return new Preference(createMercadoPagoClient(timeout))
}

export async function createValidatedMercadoPagoPreferenceClient(timeout = 5000) {
  await assertMercadoPagoTokenMatchesConfiguredSeller()
  return createMercadoPagoPreferenceClient(timeout)
}

export function createMercadoPagoPaymentClient(timeout = 5000) {
  return new Payment(createMercadoPagoClient(timeout))
}

export async function createValidatedMercadoPagoPaymentClient(timeout = 5000) {
  await assertMercadoPagoTokenMatchesConfiguredSeller()
  return createMercadoPagoPaymentClient(timeout)
}

export function createMercadoPagoPreApprovalClient(timeout = 5000) {
  return new PreApproval(createMercadoPagoClient(timeout))
}

export interface MercadoPagoPreapprovalShadowInput {
  payerEmail: string
  reason: string
  externalReference: string
  monthlyAmount: number
  backUrl: string
  trialDays: number
}

export interface MercadoPagoPreapprovalShadowResult {
  id: string
  status: string
  initPoint: string | null
  sandboxInitPoint: string | null
  trialEndsAt: string | null
  trialEndsAtEstimated: boolean
  raw: unknown
}

export async function createMercadoPagoPreapprovalWithTrial(
  input: MercadoPagoPreapprovalShadowInput
): Promise<MercadoPagoPreapprovalShadowResult> {
  await assertMercadoPagoTokenMatchesConfiguredSeller()

  const payerEmail = input.payerEmail.trim().toLowerCase()
  if (!payerEmail) {
    throw new Error('Preapproval requires payerEmail')
  }

  if (!input.externalReference.trim()) {
    throw new Error('Preapproval requires externalReference')
  }

  if (!(input.monthlyAmount > 0)) {
    throw new Error('Preapproval requires positive monthlyAmount')
  }

  const trialDays = Number(input.trialDays)
  if (!Number.isInteger(trialDays) || trialDays <= 0) {
    throw new Error('Preapproval requires valid trialDays')
  }

  const currencyId = 'BRL'
  if (currencyId !== 'BRL') {
    throw new Error(`Unsupported preapproval currency: ${currencyId}`)
  }

  const estimatedTrialEndsAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toISOString()

  const response = await fetch('https://api.mercadopago.com/preapproval', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getMercadoPagoAccessToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      payer_email: payerEmail,
      reason: input.reason,
      external_reference: input.externalReference,
      back_url: input.backUrl,
      status: 'pending',
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: input.monthlyAmount,
        currency_id: currencyId,
        free_trial: {
          frequency: trialDays,
          frequency_type: 'days',
        },
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Mercado Pago preapproval create failed: ${errorText}`)
  }

  const data = (await response.json()) as {
    id?: string | number
    status?: string
    init_point?: string | null
    sandbox_init_point?: string | null
    auto_recurring?: {
      free_trial_end_date?: string | null
    }
  }

  if (!data?.id) {
    throw new Error('Mercado Pago preapproval returned without id')
  }

  const status = String(data.status || 'unknown')
  if (!['pending', 'authorized'].includes(status)) {
    throw new Error(`Unexpected preapproval status: ${status}`)
  }

  const trialEndsAt = data.auto_recurring?.free_trial_end_date || estimatedTrialEndsAt

  return {
    id: String(data.id),
    status,
    initPoint: data.init_point || null,
    sandboxInitPoint: data.sandbox_init_point || null,
    trialEndsAt,
    trialEndsAtEstimated: !data.auto_recurring?.free_trial_end_date,
    raw: data,
  }
}

// Preços
export const PRICES = {
  PIX: {
    amount: 497,
    description: 'Zairyx — Canal Digital - PIX à vista',
    discount: 100,
  },
  CARD: {
    amount: 597,
    description: 'Zairyx — Canal Digital - Cartão',
    installments: 12, // 12x sem juros
    installmentAmount: 49.75,
  },
}

// Criar preferência de pagamento
export async function createPreference(data: {
  restaurantId: string
  restaurantName: string
  userEmail: string
  paymentMethod: 'pix' | 'card'
  baseUrl?: string
}) {
  await assertMercadoPagoTokenMatchesConfiguredSeller()
  const mercadopago = createMercadoPagoPreferenceClient()
  const isCard = data.paymentMethod === 'card'
  const price = isCard ? PRICES.CARD : PRICES.PIX

  const baseUrl = data.baseUrl || getSiteUrl()

  const preference = await mercadopago.create({
    body: {
      items: [
        {
          id: data.restaurantId,
          title: `${PRODUCT_NAME} — ${price.description}`,
          description: `Ativado por ${COMPANY_NAME} para ${data.restaurantName}`,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: price.amount,
        },
      ],
      payer: {
        email: data.userEmail,
      },
      payment_methods: isCard
        ? {
            installments: PRICES.CARD.installments,
          }
        : {
            excluded_payment_types: [{ id: 'credit_card' }, { id: 'debit_card' }],
          },
      back_urls: {
        success: `${baseUrl}/pagamento/sucesso`,
        failure: `${baseUrl}/pagamento/erro`,
        pending: `${baseUrl}/pagamento/pendente`,
      },
      auto_return: 'approved',
      external_reference: data.restaurantId,
      notification_url: `${baseUrl}/api/webhook/mercadopago`,
      // Aparece na fatura do cartão e no comprovante PIX do pagador
      // Deve bater com o nome da conta Mercado Pago para evitar estranhamento no checkout.
      statement_descriptor: COMPANY_PAYMENT_DESCRIPTOR,
    },
  })

  return preference
}
