(function () {
  const DEFAULT_COUNTRY_CODE = '55'

  function onlyDigits(value) {
    return String(value ?? '').replace(/\D/g, '')
  }

  function normalizeWhatsAppNumber(phoneNumber) {
    const digits = onlyDigits(phoneNumber)
    if (!digits) return ''

    // If already in E.164 without '+', keep it (e.g. 5511999999999).
    if (digits.length >= 12 && digits.startsWith(DEFAULT_COUNTRY_CODE)) return digits

    // Brazilian mobile/landline in national format (DDD + number).
    if (digits.length === 11 || digits.length === 10) return DEFAULT_COUNTRY_CODE + digits

    return digits
  }

  function formatBRL(value) {
    const v = Number(value)
    if (!Number.isFinite(v)) return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
  }

  function parseBRL(text) {
    const raw = String(text ?? '')
      .replace(/\s/g, '')
      .replace('R$', '')
      .replace(/\./g, '')
      .replace(',', '.')

    const n = Number(raw)
    return Number.isFinite(n) ? n : 0
  }

  function buildOrderMessage({ customerName, address, paymentMethod, notes, cart, createdAt }) {
    const now = createdAt instanceof Date ? createdAt : new Date()
    const dt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(now)

    const items = Array.isArray(cart) ? cart : []
    const lines = []

    lines.push('Novo pedido (Cardápio Digital)')
    lines.push('')
    lines.push(`Data/hora: ${dt}`)

    if (customerName) lines.push(`Nome: ${customerName}`)
    if (address) lines.push(`Endereço: ${address}`)
    if (paymentMethod) lines.push(`Pagamento: ${paymentMethod}`)

    lines.push('')
    lines.push('Itens:')

    let total = 0
    for (const it of items) {
      const qty = Number(it.qty) || 0
      const unit = parseBRL(it.price)
      const subtotal = qty * unit
      total += subtotal
      lines.push(`- ${qty}x ${it.name} — ${formatBRL(unit)} (Subtotal: ${formatBRL(subtotal)})`)
    }

    lines.push('')
    lines.push(`Total: ${formatBRL(total)}`)

    if (notes) {
      lines.push('')
      lines.push(`Observações: ${notes}`)
    }

    return lines.join('\n')
  }

  function buildWhatsAppLink({ phoneNumber, text }) {
    const phone = normalizeWhatsAppNumber(phoneNumber)
    const msg = String(text ?? '')
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
  }

  window.OrderTemplates = {
    normalizeWhatsAppNumber,
    buildWhatsAppLink,
    buildOrderMessage,
    parseBRL,
    formatBRL
  }
})()
