const menu = [
  { id: 1, name: 'Coxinha de Frango', price: 'R$ 6,50', desc: 'Coxinha crocante, recheio suculento' },
  { id: 2, name: 'Pastel de Queijo', price: 'R$ 5,00', desc: 'Pastel frito na hora, queijo derretido' },
  { id: 3, name: 'Açaí 500ml', price: 'R$ 12,00', desc: 'Açaí na tigela, granola e banana' }
]

const orderTemplates = {
  livre: {
    label: 'Mensagem livre',
    text: ''
  },
  entrega: {
    label: 'Pedido para entrega',
    text: `Olá! Quero fazer um pedido para entrega.
Itens:
- 

Endereço completo:
Forma de pagamento:
Troco para:`
  },
  retirada: {
    label: 'Pedido para retirada',
    text: `Olá! Quero fazer um pedido para retirada.
Itens:
- 

Nome para identificação:
Horário estimado para retirada:`
  },
  encomenda: {
    label: 'Encomenda especial',
    text: `Olá! Quero fazer uma encomenda especial.
Produto:
Quantidade:
Data desejada:
Observações:`
  }
}

const whatsappRawNumber = '12996887993'
const whatsappNumber = normalizeWhatsappNumber(whatsappRawNumber)

function renderMenu() {
  const container = document.getElementById('cards')
  container.innerHTML = ''
  menu.forEach(item => {
    const el = document.createElement('article')
    el.className = 'card'
    el.innerHTML = `<h3>${item.name}</h3><p>${item.desc}</p><strong>${item.price}</strong>`

    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'order-button'
    button.textContent = 'Pedir este item'
    button.addEventListener('click', () => {
      const message = buildItemOrderMessage(item)
      addChatMessage(`Pedido iniciado: ${item.name}`, 'user')
      const sent = openWhatsApp(message)
      if (sent) {
        setTimeout(() => addChatMessage(`Abrindo WhatsApp para finalizar o pedido de ${item.name}.`, 'bot'), 400)
      }
    })

    el.appendChild(button)
    container.appendChild(el)
  })
}

function addChatMessage(text, who = 'user') {
  const log = document.getElementById('chatLog')
  const p = document.createElement('div')
  p.className = 'msg ' + who
  p.textContent = text
  log.appendChild(p)
  log.scrollTop = log.scrollHeight
}

function normalizeWhatsappNumber(phone) {
  const digits = String(phone).replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('55')) return digits
  if (digits.length === 11) return `55${digits}`
  return digits
}

function buildItemOrderMessage(item) {
  return [
    'Olá! Quero fazer este pedido:',
    `- ${item.name} (${item.price})`,
    '',
    'Nome:',
    'Entrega ou retirada:',
    'Forma de pagamento:',
    'Observações:'
  ].join('\n')
}

function buildChatOrderMessage(content, templateKey) {
  const templateLabel = orderTemplates[templateKey]?.label ?? orderTemplates.livre.label
  const timeLabel = new Date().toLocaleString('pt-BR')

  return [
    '*Pedido via Cardápio Digital*',
    `*Template:* ${templateLabel}`,
    '',
    content,
    '',
    `Data: ${timeLabel}`
  ].join('\n')
}

function openWhatsApp(message) {
  if (!whatsappNumber) {
    addChatMessage('Número de WhatsApp inválido. Verifique a configuração.', 'bot')
    return false
  }

  const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
  const popup = window.open(url, '_blank', 'noopener')
  if (!popup) window.location.href = url
  return true
}

function applyTemplateToInput() {
  const templateSelect = document.getElementById('templateSelect')
  const input = document.getElementById('message')
  const selected = orderTemplates[templateSelect.value]
  if (!selected || !selected.text) return

  input.value = selected.text
  input.focus()
}

function setupChat() {
  const form = document.getElementById('chatForm')
  const applyTemplateButton = document.getElementById('applyTemplate')
  const input = document.getElementById('message')
  const numberLabel = document.getElementById('targetPhone')

  if (numberLabel) {
    numberLabel.textContent = whatsappRawNumber
  }

  applyTemplateButton.addEventListener('click', applyTemplateToInput)

  addChatMessage('Selecione um template e envie o pedido para o WhatsApp.', 'bot')

  form.addEventListener('submit', e => {
    e.preventDefault()
    const templateSelect = document.getElementById('templateSelect')
    const template = orderTemplates[templateSelect.value]
    const typedMessage = input.value.trim()
    const message = typedMessage || template.text.trim()

    if (!message) return

    addChatMessage(message, 'user')
    const finalMessage = buildChatOrderMessage(message, templateSelect.value)
    const sent = openWhatsApp(finalMessage)

    if (sent) {
      setTimeout(() => addChatMessage('Pedido encaminhado. Finalize os detalhes no WhatsApp.', 'bot'), 500)
    }

    input.value = ''
  })
}

renderMenu()
setupChat()