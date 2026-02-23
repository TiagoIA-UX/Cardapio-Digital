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
  renderDishOfDay()
  renderCategorySections()
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
      <button type="button" class="order-button">Pedir prato do dia</button>
    </div>
  `

  const button = container.querySelector('.order-button')
  button.addEventListener('click', () => {
    const message = buildItemOrderMessage(dishOfDay, 'Prato do Dia')
    addChatMessage(`Pedido iniciado: ${dishOfDay.name}`, 'user')
    const sent = openWhatsApp(message)
    if (sent) {
      setTimeout(() => addChatMessage('Abrindo WhatsApp para finalizar o pedido do prato do dia.', 'bot'), 400)
    }
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
    category.items.forEach(item => {
      cards.appendChild(buildMenuCard(item, category.title))
    })

    container.appendChild(section)
  })
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
  button.textContent = 'Pedir este item'
  button.addEventListener('click', () => {
    const message = buildItemOrderMessage(item, categoryTitle)
    addChatMessage(`Pedido iniciado: ${item.name}`, 'user')
    const sent = openWhatsApp(message)
    if (sent) {
      setTimeout(() => addChatMessage(`Abrindo WhatsApp para finalizar o pedido de ${item.name}.`, 'bot'), 400)
    }
  })

  el.appendChild(button)
  return el
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

function buildItemOrderMessage(item, category = 'Cardápio') {
  return [
    'Olá! Quero fazer este pedido:',
    `Categoria: ${category}`,
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
  if (!templateSelect || !input) return

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
  if (!form || !applyTemplateButton || !input) return

  if (numberLabel) {
    numberLabel.textContent = whatsappRawNumber
  }

  applyTemplateButton.addEventListener('click', applyTemplateToInput)

  addChatMessage('Selecione um template e envie o pedido para o WhatsApp.', 'bot')

  form.addEventListener('submit', e => {
    e.preventDefault()
    const templateSelect = document.getElementById('templateSelect')
    if (!templateSelect) return

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