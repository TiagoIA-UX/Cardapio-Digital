import { MercadoPagoConfig, Preference } from 'mercadopago'
import { loadLocalEnv } from './lib/load-env.mjs'

loadLocalEnv()

function argValue(flag) {
  const index = process.argv.indexOf(flag)
  if (index === -1) return null
  return process.argv[index + 1] || null
}

function requiredString(value, message) {
  if (!value || !String(value).trim()) {
    throw new Error(message)
  }
  return String(value).trim()
}

function parsePositiveNumber(value, fallback) {
  const parsed = Number.parseFloat(String(value ?? fallback))
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error('Preco invalido. Use um numero positivo em --price.')
  }
  return parsed
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? fallback), 10)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error('Quantidade invalida. Use um inteiro positivo em --quantity.')
  }
  return parsed
}

function resolveAccessToken() {
  return (
    process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim() ||
    process.env.MERCADOPAGO_ACCESS_TOKEN?.trim() ||
    ''
  )
}

function ensureAbsoluteUrl(input, fallback) {
  const value = String(input || fallback || '').trim()
  if (!value) return ''

  if (/^https?:\/\//i.test(value)) return value
  return `https://${value.replace(/^\/+/, '')}`
}

async function main() {
  const accessToken = resolveAccessToken()
  if (!accessToken) {
    throw new Error('Token Mercado Pago ausente. Defina MERCADO_PAGO_ACCESS_TOKEN ou MERCADOPAGO_ACCESS_TOKEN.')
  }

  const title = requiredString(
    argValue('--title') || 'Integracao GitHub App Zairyx',
    'Informe --title para o produto.'
  )
  const description = requiredString(
    argValue('--description') || 'Implementacao profissional de integracao GitHub App + blog sync',
    'Informe --description para o produto.'
  )
  const price = parsePositiveNumber(argValue('--price'), 2997)
  const quantity = parsePositiveInt(argValue('--quantity'), 1)
  const currency = (argValue('--currency') || 'BRL').toUpperCase()

  const baseSiteUrl = ensureAbsoluteUrl(process.env.NEXT_PUBLIC_SITE_URL, 'https://zairyx.com.br').replace(/\/$/, '')
  const successUrl = ensureAbsoluteUrl(argValue('--success-url'), `${baseSiteUrl}/status?mp=success`)
  const pendingUrl = ensureAbsoluteUrl(argValue('--pending-url'), `${baseSiteUrl}/status?mp=pending`)
  const failureUrl = ensureAbsoluteUrl(argValue('--failure-url'), `${baseSiteUrl}/status?mp=failure`)

  if (!successUrl) {
    throw new Error('URL de sucesso invalida. Defina NEXT_PUBLIC_SITE_URL ou --success-url com URL absoluta.')
  }

  const buyerEmail = argValue('--email') || process.env.MP_DEFAULT_BUYER_EMAIL || undefined
  const buyerName = argValue('--name') || process.env.MP_DEFAULT_BUYER_NAME || undefined
  const autoReturn = argValue('--auto-return') || null

  const externalReference = `github-app-integration-${Date.now()}`

  const client = new MercadoPagoConfig({ accessToken })
  const preference = new Preference(client)

  const body = {
    items: [
      {
        id: 'github-app-integration-zairyx',
        title,
        description,
        quantity,
        unit_price: price,
        currency_id: currency,
      },
    ],
    payer: {
      email: buyerEmail,
      name: buyerName,
    },
    external_reference: externalReference,
    metadata: {
      product: 'github-app-integration',
      source: 'zairyx-template',
    },
    back_urls: {
      success: successUrl,
      pending: pendingUrl,
      failure: failureUrl,
    },
  }

  if (autoReturn) {
    body.auto_return = autoReturn
  }

  const created = await preference.create({
    body: {
      ...body,
    },
  })

  process.stdout.write(
    `${JSON.stringify(
      {
        success: true,
        preferenceId: created.id,
        initPoint: created.init_point,
        sandboxInitPoint: created.sandbox_init_point,
        externalReference,
        product: {
          title,
          price,
          quantity,
          currency,
        },
      },
      null,
      2
    )}\n`
  )
}

function normalizeError(error) {
  if (error instanceof Error) {
    const maybeAny = error
    const details = {
      name: maybeAny.name,
      message: maybeAny.message,
      stack: maybeAny.stack,
      cause: maybeAny.cause || null,
    }
    return JSON.stringify(details, null, 2)
  }

  if (error && typeof error === 'object') {
    try {
      return JSON.stringify(error, null, 2)
    } catch {
      return String(error)
    }
  }

  return String(error)
}

main().catch((error) => {
  console.error(normalizeError(error))
  process.exit(1)
})
