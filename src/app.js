const WHATSAPP_NUMBER = '5512996887993';

const menu = [
  { id: 1, name: 'Coxinha de Frango', price: 6.50, desc: 'Coxinha crocante, recheio suculento' },
  { id: 2, name: 'Pastel de Queijo', price: 5.00, desc: 'Pastel frito na hora, queijo derretido' },
  { id: 3, name: 'Pastel de Carne', price: 5.50, desc: 'Pastel crocante com carne moída temperada' },
  { id: 4, name: 'Esfiha de Carne', price: 4.50, desc: 'Esfiha aberta com carne e temperos especiais' },
  { id: 5, name: 'Açaí 500ml', price: 12.00, desc: 'Açaí na tigela com granola e banana' },
  { id: 6, name: 'Açaí 300ml', price: 8.00, desc: 'Açaí na tigela tamanho menor' },
  { id: 7, name: 'Suco Natural', price: 7.00, desc: 'Suco de laranja ou limão natural' },
  { id: 8, name: 'Refrigerante Lata', price: 5.00, desc: 'Coca-Cola, Guaraná ou Fanta' },
  { id: 9, name: 'Água Mineral', price: 3.00, desc: 'Garrafa 500ml' },
];

let cart = [];

function formatCurrency(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function renderMenu() {
  const container = document.getElementById('cards');
  container.innerHTML = '';
  menu.forEach(item => {
    const el = document.createElement('article');
    el.className = 'card';
    el.innerHTML = `
      <h3>${item.name}</h3>
      <p>${item.desc}</p>
      <div class="card-footer">
        <strong>${formatCurrency(item.price)}</strong>
        <button class="btn btn-add" data-id="${item.id}">+ Adicionar</button>
      </div>
    `;
    container.appendChild(el);
  });

  container.addEventListener('click', e => {
    const btn = e.target.closest('.btn-add');
    if (!btn) return;
    const id = Number(btn.dataset.id);
    addToCart(id);
    btn.classList.add('added');
    btn.textContent = 'Adicionado!';
    setTimeout(() => {
      btn.classList.remove('added');
      btn.textContent = '+ Adicionar';
    }, 800);
  });
}

function addToCart(itemId) {
  const existing = cart.find(c => c.id === itemId);
  if (existing) {
    existing.qty += 1;
  } else {
    const item = menu.find(m => m.id === itemId);
    cart.push({ ...item, qty: 1 });
  }
  renderCart();
}

function removeFromCart(itemId) {
  cart = cart.filter(c => c.id !== itemId);
  renderCart();
}

function updateQty(itemId, delta) {
  const item = cart.find(c => c.id === itemId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    removeFromCart(itemId);
    return;
  }
  renderCart();
}

function getCartTotal() {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function renderCart() {
  const container = document.getElementById('cartItems');
  const summary = document.getElementById('cartSummary');
  const orderOptions = document.getElementById('orderOptions');

  if (cart.length === 0) {
    container.innerHTML = '<p class="cart-empty">Seu carrinho está vazio.<br>Adicione itens do cardápio!</p>';
    summary.classList.add('hidden');
    orderOptions.classList.add('hidden');
    return;
  }

  summary.classList.remove('hidden');

  let html = '';
  cart.forEach(item => {
    html += `
      <div class="cart-item">
        <div class="cart-item-info">
          <span class="cart-item-name">${item.name}</span>
          <span class="cart-item-price">${formatCurrency(item.price * item.qty)}</span>
        </div>
        <div class="cart-item-controls">
          <button class="btn-qty" data-id="${item.id}" data-delta="-1">−</button>
          <span class="cart-item-qty">${item.qty}</span>
          <button class="btn-qty" data-id="${item.id}" data-delta="1">+</button>
          <button class="btn-remove" data-id="${item.id}">✕</button>
        </div>
      </div>
    `;
  });
  container.innerHTML = html;

  document.getElementById('cartTotal').textContent = formatCurrency(getCartTotal());

  container.querySelectorAll('.btn-qty').forEach(btn => {
    btn.addEventListener('click', () => {
      updateQty(Number(btn.dataset.id), Number(btn.dataset.delta));
    });
  });
  container.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      removeFromCart(Number(btn.dataset.id));
    });
  });
}

function buildOrderMessage(deliveryType, customerData, paymentMethod, notes) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  let msg = `🛒 *NOVO PEDIDO — Caraguá Digital*\n`;
  msg += `📅 ${dateStr} às ${timeStr}\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━\n\n`;

  msg += `👤 *Cliente:* ${customerData.name}\n\n`;

  msg += `📋 *ITENS DO PEDIDO:*\n`;
  cart.forEach((item, i) => {
    msg += `${i + 1}. ${item.name}\n`;
    msg += `   ${item.qty}x ${formatCurrency(item.price)} = ${formatCurrency(item.price * item.qty)}\n`;
  });

  msg += `\n━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `💰 *TOTAL: ${formatCurrency(getCartTotal())}*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━\n\n`;

  if (deliveryType === 'delivery') {
    msg += `🚗 *Tipo:* Entrega\n`;
    msg += `📍 *Endereço:* ${customerData.address}\n`;
    if (customerData.complement) {
      msg += `🏠 *Complemento:* ${customerData.complement}\n`;
    }
    if (customerData.ref) {
      msg += `📌 *Referência:* ${customerData.ref}\n`;
    }
  } else {
    msg += `🏪 *Tipo:* Retirada no local\n`;
  }

  msg += `\n💳 *Pagamento:* ${paymentMethod}\n`;

  if (notes) {
    msg += `\n📝 *Observações:* ${notes}\n`;
  }

  msg += `\n━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `Obrigado pela preferência! 😊`;

  return msg;
}

function sendToWhatsApp(message) {
  const encoded = encodeURIComponent(message);
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
  window.open(url, '_blank');
}

function setupOrderFlow() {
  const btnSend = document.getElementById('btnSendOrder');
  const btnClear = document.getElementById('btnClearCart');
  const btnConfirm = document.getElementById('btnConfirmOrder');
  const btnCancel = document.getElementById('btnCancelOrder');
  const orderOptions = document.getElementById('orderOptions');
  const cartSummary = document.getElementById('cartSummary');

  const deliveryRadios = document.querySelectorAll('input[name="deliveryType"]');
  const addressFields = document.getElementById('addressFields');
  const pickupFields = document.getElementById('pickupFields');

  deliveryRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.value === 'delivery') {
        addressFields.classList.remove('hidden');
        pickupFields.classList.add('hidden');
      } else {
        addressFields.classList.add('hidden');
        pickupFields.classList.remove('hidden');
      }
    });
  });

  btnSend.addEventListener('click', () => {
    if (cart.length === 0) return;
    orderOptions.classList.remove('hidden');
    cartSummary.classList.add('hidden');
  });

  btnCancel.addEventListener('click', () => {
    orderOptions.classList.add('hidden');
    cartSummary.classList.remove('hidden');
  });

  btnClear.addEventListener('click', () => {
    cart = [];
    renderCart();
  });

  btnConfirm.addEventListener('click', () => {
    const deliveryType = document.querySelector('input[name="deliveryType"]:checked').value;
    const paymentMethod = document.getElementById('paymentMethod').value;

    if (!paymentMethod) {
      alert('Por favor, selecione a forma de pagamento.');
      return;
    }

    let customerData = {};

    if (deliveryType === 'delivery') {
      const name = document.getElementById('customerName').value.trim();
      const address = document.getElementById('customerAddress').value.trim();
      const complement = document.getElementById('customerComplement').value.trim();
      const ref = document.getElementById('customerRef').value.trim();

      if (!name) {
        alert('Por favor, informe seu nome.');
        return;
      }
      if (!address) {
        alert('Por favor, informe o endereço de entrega.');
        return;
      }

      customerData = { name, address, complement, ref };
    } else {
      const name = document.getElementById('pickupName').value.trim();
      if (!name) {
        alert('Por favor, informe seu nome.');
        return;
      }
      customerData = { name };
    }

    const notes = document.getElementById('orderNotes').value.trim();
    const message = buildOrderMessage(deliveryType, customerData, paymentMethod, notes);
    sendToWhatsApp(message);

    cart = [];
    renderCart();
    orderOptions.classList.add('hidden');
    resetForm();
  });
}

function resetForm() {
  document.getElementById('customerName').value = '';
  document.getElementById('customerAddress').value = '';
  document.getElementById('customerComplement').value = '';
  document.getElementById('customerRef').value = '';
  document.getElementById('pickupName').value = '';
  document.getElementById('paymentMethod').value = '';
  document.getElementById('orderNotes').value = '';
  document.querySelector('input[name="deliveryType"][value="delivery"]').checked = true;
  document.getElementById('addressFields').classList.remove('hidden');
  document.getElementById('pickupFields').classList.add('hidden');
}

renderMenu();
setupOrderFlow();
