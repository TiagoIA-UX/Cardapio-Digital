const menu = [
  { id: 1, name: 'Coxinha de Frango', price: 'R$ 6,50', desc: 'Coxinha crocante, recheio suculento' },
  { id: 2, name: 'Pastel de Queijo', price: 'R$ 5,00', desc: 'Pastel frito na hora, queijo derretido' },
  { id: 3, name: 'Açaí 500ml', price: 'R$ 12,00', desc: 'Açaí na tigela, granola e banana' }
]

const WHATSAPP_ORDER_NUMBER = '12996887993'
const cart = new Map() // id -> qty

function renderMenu() {
  const container = document.getElementById('cards')
  container.innerHTML = ''
  menu.forEach(item => {
    const el = document.createElement('article')
    el.className = 'card'
    el.innerHTML = `
      <h3>${item.name}</h3>
      <p>${item.desc}</p>
      <strong>${item.price}</strong>
      <div class="card-actions">
        <button type="button" data-add-id="${item.id}">Adicionar ao pedido</button>
      </div>
    `
    container.appendChild(el)
  })
}

function addChatMessage(text, who='user'){
  const log = document.getElementById('chatLog')
  const p = document.createElement('div')
  p.className = 'msg '+who
  p.textContent = text
  log.appendChild(p)
  log.scrollTop = log.scrollHeight
}

function getMenuItemById(id) {
  return menu.find(m => m.id === id)
}

function getCartItems() {
  const items = []
  for (const [id, qty] of cart.entries()) {
    const mi = getMenuItemById(id)
    if (!mi) continue
    items.push({ ...mi, qty })
  }
  items.sort((a, b) => a.id - b.id)
  return items
}

function calculateTotal(cartItems) {
  return cartItems.reduce((sum, it) => {
    const unit = window.OrderTemplates?.parseBRL?.(it.price) ?? 0
    return sum + (Number(it.qty) || 0) * unit
  }, 0)
}

function renderCart() {
  const cartEmpty = document.getElementById('cartEmpty')
  const list = document.getElementById('cartList')
  const totalEl = document.getElementById('cartTotal')

  const items = getCartItems()
  list.innerHTML = ''

  if (!items.length) {
    cartEmpty.style.display = 'block'
    totalEl.textContent = 'R$ 0,00'
    return
  }

  cartEmpty.style.display = 'none'

  for (const it of items) {
    const li = document.createElement('li')
    li.className = 'cart-item'
    li.innerHTML = `
      <div>
        <div class="name">${it.name}</div>
        <div class="meta">${it.price}</div>
      </div>
      <div class="qty-controls">
        <button type="button" aria-label="Diminuir" data-dec-id="${it.id}">−</button>
        <span class="qty-badge" aria-label="Quantidade">${it.qty}</span>
        <button type="button" aria-label="Aumentar" data-inc-id="${it.id}">+</button>
      </div>
    `
    list.appendChild(li)
  }

  const total = calculateTotal(items)
  totalEl.textContent = window.OrderTemplates?.formatBRL?.(total) ?? 'R$ 0,00'
}

function addToCart(id) {
  const current = cart.get(id) || 0
  cart.set(id, current + 1)
  renderCart()
}

function decFromCart(id) {
  const current = cart.get(id) || 0
  const next = current - 1
  if (next <= 0) cart.delete(id)
  else cart.set(id, next)
  renderCart()
}

function clearCart() {
  cart.clear()
  renderCart()
}

function setupOrderUI() {
  const cards = document.getElementById('cards')
  cards.addEventListener('click', e => {
    const btn = e.target.closest('[data-add-id]')
    if (!btn) return
    const id = Number(btn.dataset.addId)
    if (!id) return
    addToCart(id)
    addChatMessage(`Adicionado ao pedido: ${getMenuItemById(id)?.name ?? 'Item'}`, 'bot')
  })

  const cartList = document.getElementById('cartList')
  cartList.addEventListener('click', e => {
    const inc = e.target.closest('[data-inc-id]')
    const dec = e.target.closest('[data-dec-id]')
    if (inc) {
      addToCart(Number(inc.dataset.incId))
      return
    }
    if (dec) {
      decFromCart(Number(dec.dataset.decId))
    }
  })

  document.getElementById('clearOrder').addEventListener('click', () => {
    clearCart()
    addChatMessage('Pedido limpo.', 'bot')
  })

  document.getElementById('sendOrder').addEventListener('click', () => {
    const items = getCartItems()
    if (!items.length) {
      addChatMessage('Adicione itens ao pedido antes de enviar.', 'bot')
      return
    }

    const customerName = document.getElementById('customerName').value.trim()
    const address = document.getElementById('address').value.trim()
    const paymentMethod = document.getElementById('paymentMethod').value.trim()
    const notes = document.getElementById('notes').value.trim()

    const text = window.OrderTemplates.buildOrderMessage({
      customerName,
      address,
      paymentMethod,
      notes,
      cart: items,
      createdAt: new Date()
    })

    const url = window.OrderTemplates.buildWhatsAppLink({
      phoneNumber: WHATSAPP_ORDER_NUMBER,
      text
    })

    addChatMessage('Abrindo o WhatsApp com seu pedido…', 'bot')
    const w = window.open(url, '_blank', 'noopener,noreferrer')
    if (!w) window.location.href = url
  })
}

function setupChat(){
  const form = document.getElementById('chatForm')
  form.addEventListener('submit', e=>{
    e.preventDefault()
    const input = document.getElementById('message')
    const msg = input.value.trim()
    if(!msg) return
    addChatMessage(msg,'user')
    // resposta demo
    setTimeout(()=> addChatMessage('Obrigado! Seu pedido foi recebido. (demo)','bot'),600)
    input.value = ''
  })
}

renderMenu()
renderCart()
setupOrderUI()
setupChat()
