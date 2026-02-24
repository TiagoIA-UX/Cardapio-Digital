const dishOfDay = {
  name: 'Parmegiana de Frango',
  desc: 'Filé empanado ao molho de tomate e queijo, com arroz, fritas e salada.',
  price: 'R$ 29,90',
  image: 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?auto=format&fit=crop&w=900&q=80'
}

const menuByCategory = [
  {
    id: 'pizzas',
    title: 'Pizzas',
    subtitle: 'Exemplo de pizza',
    highlight: 'Fotos que dão água na boca',
    items: [
      {
        id: 101,
        name: 'Pizza Calabresa',
        desc: 'Mussarela, calabresa fatiada e cebola roxa.',
        price: 'R$ 49,90',
        image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80'
      },
      {
        id: 102,
        name: 'Pizza Margherita',
        desc: 'Molho artesanal, mussarela, tomate e manjericão.',
        price: 'R$ 47,90',
        image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=900&q=80'
      },
      {
        id: 103,
        name: 'Pizza Portuguesa',
        desc: 'Presunto, ovos, cebola, ervilha e mussarela.',
        price: 'R$ 52,90',
        image: 'https://images.unsplash.com/photo-1594007654729-407eedc4be65?auto=format&fit=crop&w=900&q=80'
      }
    ]
  },
  {
    id: 'lanches',
    title: 'Lanches',
    subtitle: 'Exemplo de lanche',
    highlight: 'Precos claros',
    items: [
      {
        id: 201,
        name: 'X-Burger Artesanal',
        desc: 'Pão brioche, hambúrguer bovino 160g e queijo cheddar.',
        price: 'R$ 22,90',
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80'
      },
      {
        id: 202,
        name: 'X-Bacon',
        desc: 'Hambúrguer suculento, bacon crocante e molho da casa.',
        price: 'R$ 25,90',
        image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80'
      },
      {
        id: 203,
        name: 'Frango Crocante',
        desc: 'Sanduíche com frango empanado, alface e maionese especial.',
        price: 'R$ 21,90',
        image: 'https://images.unsplash.com/photo-1610614819513-58e34989848b?auto=format&fit=crop&w=900&q=80'
      }
    ]
  }
]

const showcaseTemplates = [
  {
    id: 'prato',
    cardLabel: 'Exemplo de prato',
    title: 'Prato do Dia',
    subtitle: 'Categoria organizada',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
    fulfillmentType: 'entrega',
    text: `Categoria: Prato do Dia
Itens:
- 1x Parmegiana de Frango (R$ 29,90)

Observações:`
  },
  {
    id: 'pizza',
    cardLabel: 'Exemplo de pizza',
    title: 'Pizzas',
    subtitle: 'Fotos que dão água na boca',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80',
    fulfillmentType: 'entrega',
    text: `Categoria: Pizzas
Itens:
- 1x Pizza Calabresa (R$ 49,90)

Observações:`
  },
  {
    id: 'lanche',
    cardLabel: 'Exemplo de lanche',
    title: 'Lanches',
    subtitle: 'Precos claros',
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80',
    fulfillmentType: 'retirada',
    text: `Categoria: Lanches
Itens:
- 1x X-Burger Artesanal (R$ 22,90)

Observações:`
  }
]

const orderTemplates = {
  livre: {
    label: 'Mensagem livre',
    text: ''
  },
  entrega: {
    label: 'Pedido para entrega',
    text: `Itens:
- 

Observações:`
  },
  retirada: {
    label: 'Pedido para retirada',
    text: `Itens:
- 

Horário para retirada:
Observações:`
  },
  encomenda: {
    label: 'Encomenda especial',
    text: `Produto:
Quantidade:
Data desejada:
Observacoes:`
  }
}

const whatsappRawNumber = '12996887993'
const whatsappNumber = normalizeWhatsappNumber(whatsappRawNumber)

function renderMenu() {
  renderDishOfDay()
  renderCategorySections()
  renderShowcaseTemplates()
}

function renderDishOfDay() {
  const container = document.getElementById('dishOfDay')
  if (!container) return

  container.innerHTML = `
    <img class="dish-highlight-image" src="${dishOfDay.image}" alt="Prato do Dia ${dishOfDay.name}">
    <div class="dish-highlight-content">
      <p class="section-label">Prato do Dia</p>
      <h3>${dishOfDay.name}</h3>
      <p>${dishOfDay.desc}</p>
      <strong class="price">${dishOfDay.price}</strong>
      <button type="button" class="order-button">Adicionar ao pedido</button>
    </div>
  `

  const button = container.querySelector('.order-button')
  if (!button) return

  button.addEventListener('click', () => {
    prefillOrderItem(dishOfDay, 'Prato do Dia')
  })
}

function renderCategorySections() {
  const container = document.getElementById('categorySections')
  if (!container) return

  container.innerHTML = ''

  menuByCategory.forEach(category => {
    const section = document.createElement('section')
    section.className = 'category-section'
    section.innerHTML = `
      <header class="category-header">
        <p class="section-label">${category.highlight}</p>
        <h3>${category.title}</h3>
        <p>${category.subtitle}</p>
      </header>
      <div class="cards"></div>
    `

    const cards = section.querySelector('.cards')
    if (cards) {
      category.items.forEach(item => {
        cards.appendChild(buildMenuCard(item, category.title))
      })
    }

    container.appendChild(section)
  })
}

function renderShowcaseTemplates() {
  const container = document.getElementById('showcaseTemplates')
  if (!container) return

  container.innerHTML = ''

  showcaseTemplates.forEach(template => {
    const redirectUrl = buildTemplateRedirectUrl(template)
    const el = document.createElement('article')
    el.className = 'showcase-card'
    el.innerHTML = `
      <img class="showcase-image" src="${template.image}" alt="${template.cardLabel}">
      <div class="showcase-content">
        <p class="showcase-label">${template.cardLabel}</p>
        <h4>${template.title}</h4>
        <p>${template.subtitle}</p>
        <a class="order-link-button" href="${redirectUrl}" target="_blank" rel="noopener noreferrer">Abrir template</a>
      </div>
    `

    container.appendChild(el)
  })
}

function buildTemplateRedirectUrl(template) {
  if (!whatsappNumber) return '#'

  const message = [
    '*Template de pedido*',
    `*${template.cardLabel}*`,
    '',
    template.text,
    '',
    'Preencha os dados que faltam e finalize seu pedido.'
  ].join('\n')

  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
}

function buildMenuCard(item, categoryTitle) {
  const el = document.createElement('article')
  el.className = 'card'
  el.innerHTML = `
    <img class="card-image" src="${item.image}" alt="${item.name}">
    <div class="card-body">
      <h4>${item.name}</h4>
      <p>${item.desc}</p>
      <strong class="price">${item.price}</strong>
    </div>
  `

  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'order-button'
  button.textContent = 'Adicionar ao pedido'
  button.addEventListener('click', () => {
    prefillOrderItem(item, categoryTitle)
  })

  el.appendChild(button)
  return el
}

function prefillOrderItem(item, categoryTitle) {
  const input = document.getElementById('message')
  if (!input) return

  const itemLine = `- 1x ${item.name} (${item.price})`
  const current = input.value.trim()

  if (!current) {
    input.value = `Categoria: ${categoryTitle}\nItens:\n${itemLine}`
  } else if (!current.includes(itemLine)) {
    input.value = `${current}\n${itemLine}`
  }

  input.focus()
  addChatMessage(`Item adicionado ao pedido: ${item.name}.`, 'bot')
}

function addChatMessage(text, who = 'user') {
  const log = document.getElementById('chatLog')
  if (!log) return

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

function readFieldValue(id) {
  const element = document.getElementById(id)
  return element ? element.value.trim() : ''
}

function collectOrderData() {
  return {
    customerName: readFieldValue('customerName'),
    customerPhone: readFieldValue('customerPhone'),
    fulfillmentType: readFieldValue('fulfillmentType') || 'entrega',
    addressStreet: readFieldValue('addressStreet'),
    addressNumber: readFieldValue('addressNumber'),
    addressDistrict: readFieldValue('addressDistrict'),
    addressReference: readFieldValue('addressReference'),
    paymentMethod: readFieldValue('paymentMethod'),
    cashChange: readFieldValue('cashChange')
  }
}

function validateOrderData(orderData, itemsDetails) {
  const missing = []

  if (!orderData.customerName) missing.push('Nome do cliente')

  const phoneDigits = orderData.customerPhone.replace(/\D/g, '')
  if (phoneDigits.length < 10) missing.push('Telefone válido para contato')

  if (!itemsDetails) missing.push('Itens do pedido')

  if (orderData.fulfillmentType === 'entrega') {
    if (!orderData.addressStreet) missing.push('Rua/Avenida para entrega')
    if (!orderData.addressNumber) missing.push('Número para entrega')
    if (!orderData.addressDistrict) missing.push('Bairro para entrega')
  }

  if (!orderData.paymentMethod) missing.push('Forma de pagamento')

  if (orderData.paymentMethod === 'dinheiro' && !orderData.cashChange) {
    missing.push('Troco para quanto (pagamento em dinheiro)')
  }

  return missing
}

function isTemplateStillDefault(content, templateKey) {
  if (templateKey === 'livre') return false
  const templateText = orderTemplates[templateKey]?.text?.trim()
  if (!templateText) return false
  return content.trim() === templateText
}

function buildChatOrderMessage(content, templateKey, orderData) {
  const templateLabel = orderTemplates[templateKey]?.label ?? orderTemplates.livre.label
  const timeLabel = new Date().toLocaleString('pt-BR')
  const fulfillmentLabel = orderData.fulfillmentType === 'entrega' ? 'Entrega' : 'Retirada'
  const paymentMap = {
    pix: 'PIX',
    cartao: 'Cartão',
    dinheiro: 'Dinheiro'
  }
  const paymentLabel = paymentMap[orderData.paymentMethod] || orderData.paymentMethod

  const lines = [
    '*Pedido via Cardápio Digital*',
    `*Template:* ${templateLabel}`,
    `*Data:* ${timeLabel}`,
    '',
    `*Cliente:* ${orderData.customerName}`,
    `*Telefone:* ${orderData.customerPhone}`,
    `*Atendimento:* ${fulfillmentLabel}`
  ]

  if (orderData.fulfillmentType === 'entrega') {
    lines.push(
      `*Endereço:* ${orderData.addressStreet}, ${orderData.addressNumber}`,
      `*Bairro:* ${orderData.addressDistrict}`
    )
    if (orderData.addressReference) {
      lines.push(`*Referência:* ${orderData.addressReference}`)
    }
  }

  lines.push(`*Pagamento:* ${paymentLabel}`)

  if (orderData.paymentMethod === 'dinheiro') {
    lines.push(`*Troco para:* ${orderData.cashChange}`)
  }

  lines.push('', '*Itens e observações:*', content)

  return lines.join('\n')
}

function updateConditionalFields() {
  const fulfillmentType = readFieldValue('fulfillmentType') || 'entrega'
  const paymentMethod = readFieldValue('paymentMethod')
  const deliveryFields = document.getElementById('deliveryFields')
  const cashChangeWrapper = document.getElementById('cashChangeWrapper')
  const cashChangeInput = document.getElementById('cashChange')

  if (deliveryFields) {
    deliveryFields.classList.toggle('is-hidden', fulfillmentType !== 'entrega')
  }

  if (cashChangeWrapper) {
    const shouldShowCash = paymentMethod === 'dinheiro'
    cashChangeWrapper.classList.toggle('is-hidden', !shouldShowCash)
    if (!shouldShowCash && cashChangeInput) cashChangeInput.value = ''
  }
}

function applyTemplateToInput() {
  const templateSelect = document.getElementById('templateSelect')
  const input = document.getElementById('message')
  const fulfillmentType = document.getElementById('fulfillmentType')
  if (!templateSelect || !input) return

  const selected = orderTemplates[templateSelect.value]
  if (!selected || !selected.text) return

  input.value = selected.text

  if (fulfillmentType && (templateSelect.value === 'entrega' || templateSelect.value === 'retirada')) {
    fulfillmentType.value = templateSelect.value
    updateConditionalFields()
  }

  input.focus()
}

function setupChat() {
  const form = document.getElementById('chatForm')
  const applyTemplateButton = document.getElementById('applyTemplate')
  const input = document.getElementById('message')
  const numberLabel = document.getElementById('targetPhone')
  const fulfillmentType = document.getElementById('fulfillmentType')
  const paymentMethod = document.getElementById('paymentMethod')

  if (!form || !applyTemplateButton || !input) return

  if (numberLabel) numberLabel.textContent = whatsappRawNumber

  applyTemplateButton.addEventListener('click', applyTemplateToInput)

  if (fulfillmentType) fulfillmentType.addEventListener('change', updateConditionalFields)
  if (paymentMethod) paymentMethod.addEventListener('change', updateConditionalFields)
  updateConditionalFields()

  addChatMessage('Preencha os dados obrigatórios e envie o pedido completo para o WhatsApp.', 'bot')

  form.addEventListener('submit', e => {
    e.preventDefault()
    const templateSelect = document.getElementById('templateSelect')
    if (!templateSelect) return

    const template = orderTemplates[templateSelect.value] || orderTemplates.livre
    const typedMessage = input.value.trim()
    const message = typedMessage || template.text.trim()
    const orderData = collectOrderData()

    const missing = validateOrderData(orderData, message)
    if (isTemplateStillDefault(message, templateSelect.value)) {
      missing.push('Detalhar os itens do pedido no campo de mensagem')
    }

    if (missing.length > 0) {
      addChatMessage(`Faltam dados obrigatórios:\n- ${missing.join('\n- ')}`, 'bot')
      return
    }

    addChatMessage(`Pedido validado para ${orderData.customerName}.`, 'user')
    const finalMessage = buildChatOrderMessage(message, templateSelect.value, orderData)
    const sent = openWhatsApp(finalMessage)

    if (sent) {
      setTimeout(() => addChatMessage('Pedido enviado. Agora é só confirmar no WhatsApp.', 'bot'), 500)
      input.value = ''
    }
  })
}

renderMenu()
setupChat()