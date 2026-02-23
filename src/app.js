const WHATSAPP_NUMBER = '5512996887993'

const menu = [
  { id: 1, name: 'Coxinha de Frango', price: 6.50, priceStr: 'R$ 6,50', desc: 'Coxinha crocante, recheio suculento' },
  { id: 2, name: 'Pastel de Queijo', price: 5.00, priceStr: 'R$ 5,00', desc: 'Pastel frito na hora, queijo derretido' },
  { id: 3, name: 'Açaí 500ml', price: 12.00, priceStr: 'R$ 12,00', desc: 'Açaí na tigela, granola e banana' }
]

let cart = []

function addToCart(item, qty = 1) {
  const existing = cart.find(c => c.id === item.id)
  if (existing) existing.qty += qty
  else cart.push({ ...item, qty })
  renderCart()
}

function removeFromCart(itemId) {
  cart = cart.filter(c => c.id !== itemId)
  renderCart()
}

function getCartTotal() {
  return cart.reduce((sum, c) => sum + c.price * c.qty, 0)
}

function formatPrice(n) {
  return 'R$ ' + n.toFixed(2).replace('.', ',')
}

function buildOrderMessage() {
  if (cart.length === 0) return ''
  const lines = ['*Pedido - Cardápio Digital Caraguá*', '', 'Itens:']
  cart.forEach(c => {
    lines.push(`• ${c.qty}x ${c.name} - ${formatPrice(c.price * c.qty)}`)
  })
  lines.push('', `*Total: ${formatPrice(getCartTotal())}*`)
  return lines.join('\n')
}

function sendOrderToWhatsApp() {
  const msg = buildOrderMessage()
  if (!msg) {
    addChatMessage('Adicione itens ao carrinho antes de enviar o pedido.', 'bot')
    return
  }
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`
  window.open(url, '_blank')
  addChatMessage('Pedido enviado! Abra o WhatsApp para finalizar.', 'bot')
}

function renderMenu() {
  const container = document.getElementById('cards')
  container.innerHTML = ''
  menu.forEach(item => {
    const el = document.createElement('article')
    el.className = 'card'
    el.innerHTML = `
      <h3>${item.name}</h3>
      <p>${item.desc}</p>
      <strong>${item.priceStr}</strong>
      <button class="btn-add" data-id="${item.id}">Adicionar</button>
    `
    el.querySelector('.btn-add').addEventListener('click', () => addToCart(item))
    container.appendChild(el)
  })
}

function renderCart() {
  const container = document.getElementById('cartItems')
  const totalEl = document.getElementById('cartTotal')
  if (!container) return
  container.innerHTML = ''
  cart.forEach(c => {
    const li = document.createElement('li')
    li.innerHTML = `
      <span>${c.qty}x ${c.name}</span>
      <span>${formatPrice(c.price * c.qty)}</span>
      <button class="btn-remove" data-id="${c.id}">×</button>
    `
    li.querySelector('.btn-remove').addEventListener('click', () => removeFromCart(c.id))
    container.appendChild(li)
  })
  if (totalEl) totalEl.textContent = formatPrice(getCartTotal())
}

function addChatMessage(text, who='user'){
  const log = document.getElementById('chatLog')
  const p = document.createElement('div')
  p.className = 'msg '+who
  p.textContent = text
  log.appendChild(p)
  log.scrollTop = log.scrollHeight
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

function setupSendOrder() {
  const btn = document.getElementById('sendOrderBtn')
  if (btn) btn.addEventListener('click', sendOrderToWhatsApp)
}

renderMenu()
renderCart()
setupChat()
setupSendOrder()