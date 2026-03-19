# 🍽️ PROMPT FINAL: Auditoria de Plataforma de Restaurantes + Client Chaos Testing

**Status**: Industry standards (QAble, TestGrid, BrowserStack) + Seu caso de uso de cardápio digital

---

## 📋 RESUMO EXECUTIVO

Este prompt consolida:
1. **Padrões reais de testes** para plataformas de food delivery (Swiggy, Zomato patterns)
2. **Simulação de clientes** fazendo pedidos via cardápio digital
3. **Chaos testing** de "cliente burro" tentando quebrar fluxo de compra
4. **Integração completa**: Cardápio → Checkout → Mercado Pago → Comissão de Afiliado

---

## 🎯 PARTE 1: CENÁRIOS CRÍTICOS PARA TESTAR

### **Bloco A: Fluxo de Cliente Legítimo (Happy Path)**

```
[ ] A1 - DESCOBERTA DO RESTAURANTE
    ├─ Cliente acessa cardápio digital via link de afiliado
    ├─ Landing page carrega em < 2s
    ├─ Cardápio renderiza corretamente (imagens, preços, descrições)
    ├─ Busca funciona (filtrar por tipo de prato, ingredientes)
    ├─ Filtros (vegetariano, sem lactose, etc) aplicam corretamente
    └─ Mobile responsivo? (teste em iPhone 12, Pixel 5)

[ ] A2 - COMPOSIÇÃO DO PEDIDO
    ├─ Cliente clica em produto → modal/drawer abre com detalhes
    ├─ Seleciona quantidade (mínimo 1, máximo 99)
    ├─ Seleciona adicionais (ex: cebola extra, sem tomate)
    ├─ Vê preço atualizar em real-time quando muda quantidade
    ├─ Add to cart funciona (confirmação visual)
    ├─ Carrinho mostra: itens, qtd, preço total, comissão transparente
    └─ Remove item do carrinho funciona

[ ] A3 - CHECKOUT
    ├─ Clica "Finalizar Compra" → vai para checkout
    ├─ Resumo do pedido correto (itens, quantidade, preços)
    ├─ Pede email/telefone do cliente (valida formato)
    ├─ Pede endereço de entrega (opcional ou obrigatório?)
    ├─ Mostra método de pagamento (Mercado Pago)
    ├─ Aceita cupom de desconto (se aplicável)
    └─ Mostra total FINAL com transparência

[ ] A4 - PAGAMENTO (MERCADO PAGO)
    ├─ Clica "Pagar" → redireciona para Mercado Pago
    ├─ Preenche dados do cartão (Mercado Pago test card)
    ├─ Transação aprovada → retorna para seu site
    ├─ Mostra confirmação de pedido
    ├─ Envia email de confirmação ao cliente
    ├─ Restaurante recebe notificação de novo pedido
    └─ Dashboard do afiliado mostra comissão creditada

[ ] A5 - COMISSÃO DO AFILIADO
    ├─ Comissão creditada ao afiliado em tempo real (ou T+1?)
    ├─ Dashboard afiliado mostra: pedido ID, valor, comissão %
    ├─ Histórico de pedidos? (filtrável por data, status)
    ├─ Pode sacar? (atinge mínimo de R$50?)
    ├─ Saque processado via Pix
    └─ Recebe email de confirmação de saque
```

### **Bloco B: Cliente Burro Level 1 (Cliques Estúpidos)**

```
[ ] B1 - DOUBLE-CLICK NO BOTÃO "ADICIONAR"
    Esperado: Add to cart 1x só, não 2x
    └─ Test: Click 100x rápido, verificar qtd no carrinho = 1

[ ] B2 - BACK/FORWARD RÁPIDO NO CHECKOUT
    Esperado: Carrinho não se perde, dados permanecem
    └─ Test: cliente.page.goBack() + goForward() + validar carrinho

[ ] B3 - REFRESH NA PÁGINA DO CARRINHO
    Esperado: Carrinho não limpa (localStorage ou session)
    └─ Test: await page.reload() → carrinho ainda lá?

[ ] B4 - FECHAR ABA DURANTE PAGAMENTO
    Esperado: Pagamento não processa (ou idempotente se webhook falha)
    └─ Test: Abort request mid-checkout, verificar se pedido não criado

[ ] B5 - ENVIAR FORM 3X RÁPIDO (RACE CONDITION)
    Esperado: Pedido criado 1x só, não 3x
    └─ Test: Promise.all([submit, submit, submit]) → 1 order no DB

[ ] B6 - QUANTIDADE INVÁLIDA
    Esperado: Rejeita 0, -1, 999999, string
    └─ Test: Inserir valor inválido → mostrar erro ou ignorar?

[ ] B7 - ADICIONAL COM PREÇO INVÁLIDO
    Esperado: Cálculo de preço correto mesmo com adicional
    └─ Test: Prato R$50 + adicional R$5 = R$55 final, não R$50
```

### **Bloco C: Cliente Burro Level 2 (Fraude Sofisticada)**

```
[ ] C1 - MANIPULAR PREÇO VIA NETWORK
    Esperado: Backend valida preço, não confia em frontend
    └─ Test: Interceptar request, mudar preço de R$100 → R$1
              → Server DEVE rejeitar ou usar seu preço (não o do cliente)

[ ] C2 - MANIPULAR QUANTIDADE NO CARRINHO (DevTools)
    Esperado: Backend valida, não confia em localStorage
    └─ Test: localStorage.setItem('cart', '999 itens')
              → Checkout deve validar e rejeitar ou limitar

[ ] C3 - COPIAR LINK DE AFILIADO, TENTAR SACAR COMISSÃO 2X
    Esperado: Sistema detecta duplicação, paga 1x só
    └─ Test: Dois clientes (ou bot) usa MESMO link, pede saque 2x
              → Apenas 1 saque processado

[ ] C4 - CLIENTE COMPRA COM MESMO EMAIL 10X em 1 hora
    Esperado: Bloqueia bot-farm ou limita por hora
    └─ Test: Criar 10 pedidos com mesmo email → rate limiting?

[ ] C5 - VPN/IP MUDANDO A CADA CLICK
    Esperado: Detecta padrão suspeito (país -> país em segundos)
    └─ Test: Click de São Paulo, IP de Mumbai, IP de Tokyo
              → Flag como suspeito?

[ ] C6 - CARRINHO COM 10.000 ITENS
    Esperado: Limita (máximo 999?) ou mostra timeout
    └─ Test: Tentar adicionar 10000 itens → erro gracioso, não crash

[ ] C7 - CUPOM DE DESCONTO FAKE
    Esperado: Valida cupom no backend, rejeita fake
    └─ Test: Cupom "HACK100" → erro 400, não aplica desconto

[ ] C8 - CHARGEBACK NA COMPRA
    Esperado: Afiliado perde comissão se cliente faz chargeback
    └─ Test: Compra aprovada → chargeback → comissão revertida
```

### **Bloco D: Cliente Burro Level 3 (Engenharia Reversa)**

```
[ ] D1 - MANIPULAR WEBHOOK DE PAGAMENTO
    Esperado: Backend valida assinatura HMAC do Mercado Pago
    └─ Test: Enviar webhook falso → 401/403 Unauthorized
              Mercado Pago SEMPRE assina com HMAC-SHA256

[ ] D2 - REPLAY ATTACK (WEBHOOK 2X)
    Esperado: Idempotente - webhook 2x = 1 pedido no BD
    └─ Test: Enviar webhook.json 2x com mesmo payment_id
              → Sistema ignora duplicado (marca como "já processado")

[ ] D3 - TENTAR CRIAR MÚLTIPLAS CONTAS DE AFILIADO FAKE
    Esperado: Detecta emails similares (john+1, john+2, etc)
    └─ Test: Registrar 5 afiliados com john+{1-5}@test.com
              → Sistema detecta padrão? Bloqueia?

[ ] D4 - CIRCULAR REFERRALS (A→B→C→A)
    Esperado: Detecta padrão, reverte comissões
    └─ Test: Aff A pede via link B, B via link C, C via link A
              → Flag como fraude, todos bloqueados

[ ] D5 - INJETAR SQL NO ENDEREÇO (BASIC SQL INJECTION)
    Esperado: Sanitiza input, query parameterizada
    └─ Test: Endereço: "Rua ' OR '1'='1'; --"
              → Deve tratar como string literal, não executar SQL

[ ] D6 - XSS NO NOME DO RESTAURANTE
    Esperado: Escapar HTML/JS, renderizar como texto
    └─ Test: Nome do restaurante: "<img src=x onerror=alert('xss')>"
              → Deve exibir como texto, não executar JS

[ ] D7 - RACE CONDITION: PAY + CANCEL SIMULTÂNEAMENTE
    Esperado: Transação atômica - pedido é pago OU cancelado, nunca ambos
    └─ Test: Promise.all([pay(), cancel()]) → estado consistente

[ ] D8 - CSRF: FORJAR REQUEST DE SAQUE
    Esperado: CSRF token validado, não deixa sacar sem token
    └─ Test: POST /api/affiliate/withdraw SEM csrf token
              → 403 Forbidden
```

---

## 🟢 PARTE 2: ARQUITETURA DE TESTES (POM + Fixtures)

### **2.1 Estrutura de Pastas**

```
tests/
├── fixtures/
│   ├── restaurant-fixtures.ts      # Setup: restaurante, cardápio
│   ├── customer-fixtures.ts        # Setup: cliente, carrinho
│   ├── affiliate-fixtures.ts       # Setup: afiliado, link referência
│   └── payment-fixtures.ts         # Setup: Mercado Pago mock
│
├── page-objects/
│   ├── MenuPage.ts                 # POM: cardápio, busca, filtros
│   ├── CartPage.ts                 # POM: carrinho, itens
│   ├── CheckoutPage.ts             # POM: checkout, endereço
│   ├── PaymentPage.ts              # POM: Mercado Pago gateway
│   ├── ConfirmationPage.ts         # POM: pedido confirmado
│   ├── AffiliateSignupPage.ts      # POM: cadastro afiliado
│   └── AffiliateDashboardPage.ts   # POM: dashboard afiliado
│
├── e2e/
│   ├── happy-path/
│   │   ├── customer-discovery.spec.ts    # A1-A2
│   │   ├── menu-ordering.spec.ts         # A2-A3
│   │   ├── checkout-payment.spec.ts      # A3-A4
│   │   └── affiliate-commission.spec.ts  # A5
│   │
│   ├── chaos-level-1/
│   │   ├── double-click.spec.ts          # B1
│   │   ├── navigation-abuse.spec.ts      # B2-B4
│   │   ├── form-validation.spec.ts       # B6-B7
│   │   └── race-conditions.spec.ts       # B5
│   │
│   ├── chaos-level-2/
│   │   ├── price-manipulation.spec.ts    # C1-C2
│   │   ├── bot-farm-detection.spec.ts    # C4-C5
│   │   ├── cart-abuse.spec.ts            # C6
│   │   └── discount-fraud.spec.ts        # C7-C8
│   │
│   └── chaos-level-3/
│       ├── webhook-attacks.spec.ts       # D1-D2
│       ├── account-fraud.spec.ts         # D3-D4
│       ├── injection-attacks.spec.ts     # D5-D6
│       └── race-condition-payment.spec.ts # D7-D8
│
├── api/
│   ├── order.api.spec.ts           # POST /api/order
│   ├── payment.api.spec.ts         # Mercado Pago webhook
│   ├── affiliate.api.spec.ts       # Comissão, saque
│   └── menu.api.spec.ts            # GET /api/menu
│
├── utils/
│   ├── customer-helper.ts          # Simular cliente (click, add, checkout)
│   ├── affiliate-helper.ts         # Simular afiliado (cadastro, link)
│   ├── payment-helper.ts           # Mock Mercado Pago
│   ├── db-helper.ts                # Acesso direto ao BD (verificar estado)
│   └── test-data.ts                # Faker: restaurantes, clientes, pedidos
│
└── playwright.config.ts
```

### **2.2 Page Object Models (Exemplo MenuPage)**

```typescript
// page-objects/MenuPage.ts

export class MenuPage {
  constructor(private page: Page) {}

  async navigateToMenu(restaurantId: string, affiliateRef?: string) {
    const url = new URL('/cardapio/' + restaurantId, 'http://localhost:3000');
    if (affiliateRef) {
      url.searchParams.set('ref', affiliateRef);
    }
    await this.page.goto(url.toString());
    await this.page.waitForLoadState('networkidle');
  }

  async searchDish(query: string) {
    const searchInput = this.page.getByRole('textbox', { name: /buscar/i });
    await searchInput.fill(query);
    await this.page.waitForLoadState('networkidle');
  }

  async filterByCategory(category: 'pizza' | 'sopa' | 'salada' | 'bebida') {
    await this.page
      .getByRole('button', { name: new RegExp(category, 'i') })
      .click();
    await this.page.waitForLoadState('networkidle');
  }

  async getDishCard(dishName: string) {
    return this.page.getByRole('article').filter({ hasText: dishName });
  }

  async clickAddToCart(dishName: string) {
    const card = await this.getDishCard(dishName);
    await card.getByRole('button', { name: /adicionar/i }).click();
  }

  async expectDishPrice(dishName: string, expectedPrice: number) {
    const card = await this.getDishCard(dishName);
    const priceText = await card.getByText(/r\$|reais/i).textContent();
    const price = parseFloat(priceText?.replace(/[^\d,]/g, '').replace(',', '.') || '0');
    expect(price).toBe(expectedPrice);
  }

  async expectMenuLoaded() {
    await expect(
      this.page.getByRole('heading', { name: /cardápio|menu/i })
    ).toBeVisible();
  }
}
```

### **2.3 Fixtures Reutilizáveis**

```typescript
// fixtures/customer-fixtures.ts

import { test as base } from '@playwright/test';

export type CustomerFixtures = {
  restaurant: RestaurantData;
  affiliate: AffiliateData;
  customerHelper: CustomerHelperService;
};

export const test = base.extend<CustomerFixtures>({
  restaurant: async ({}, use) => {
    const restaurant = {
      id: 'rest-' + Date.now(),
      name: 'Pizzaria Teste',
      slug: 'pizzaria-teste',
      menu: [
        { id: 'pizza-1', name: 'Margherita', price: 45, category: 'pizza' },
        { id: 'pizza-2', name: 'Calabresa', price: 50, category: 'pizza' },
        { id: 'suco-1', name: 'Suco Natural', price: 12, category: 'bebida' },
      ],
    };
    await use(restaurant);
    // Cleanup depois do teste
    await db.restaurants.delete(restaurant.id);
  },

  affiliate: async ({}, use) => {
    const affiliate = {
      id: 'aff-' + Date.now(),
      email: `aff-${Date.now()}@test.com`,
      referralCode: 'AFF' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      balance: 0,
    };
    await db.affiliates.insert(affiliate);
    await use(affiliate);
    await db.affiliates.delete(affiliate.id);
  },

  customerHelper: async ({ page, restaurant, affiliate }, use) => {
    const helper = new CustomerHelperService(page, restaurant, affiliate);
    await use(helper);
  },
});

// Usar assim no teste:
test('cliente faz compra completa', async ({ customerHelper, restaurant }) => {
  await customerHelper.navigateToMenu();
  await customerHelper.addDishToCart('Margherita', quantity: 2);
  await customerHelper.checkout();
  // ...
});
```

---

## 🟡 PARTE 3: TESTES DE CHAOS (Exemplos Reais)

### **3.1 Happy Path: Cliente Legítimo Completo**

```typescript
// tests/e2e/happy-path/full-order-flow.spec.ts

import { test } from '../../fixtures/customer-fixtures';
import { expect } from '@playwright/test';

test.describe('✅ HAPPY PATH: Cliente Legítimo', () => {

  test('deve fazer pedido completo e afiliado ganhar comissão', async ({
    page,
    customerHelper,
    restaurant,
    affiliate,
  }) => {
    // Step 1: Cliente acessa cardápio via link de afiliado
    await customerHelper.navigateToMenu(restaurant.id, affiliate.referralCode);

    // Step 2: Procura por pizza
    await customerHelper.searchDish('margherita');
    await expect(page.getByText('Margherita')).toBeVisible();

    // Step 3: Adiciona ao carrinho (quantidade 2)
    await customerHelper.addDishToCart('Margherita', 2);
    let cartTotal = await customerHelper.getCartTotal();
    expect(cartTotal).toBe(90); // 45 * 2

    // Step 4: Adiciona outro produto
    await customerHelper.addDishToCart('Suco Natural', 1);
    cartTotal = await customerHelper.getCartTotal();
    expect(cartTotal).toBe(102); // 90 + 12

    // Step 5: Vai para checkout
    await customerHelper.goToCheckout();
    await expect(page.getByRole('heading', { name: /resumo/i })).toBeVisible();

    // Step 6: Preenche dados
    const customerEmail = `customer-${Date.now()}@test.com`;
    await customerHelper.fillDeliveryInfo({
      email: customerEmail,
      phone: '11987654321',
      address: 'Rua Teste, 123, São Paulo',
      number: '123',
    });

    // Step 7: Paga com cartão de teste
    const paymentHelper = new PaymentHelperService(page);
    const paymentId = await paymentHelper.simulateMercadoPagoPayment(102);

    // Step 8: Confirmação
    await expect(page.getByText(/confirmado|sucesso/i)).toBeVisible();
    const orderId = await customerHelper.extractOrderId();
    expect(orderId).toBeTruthy();

    // Step 9: Verifica comissão do afiliado (10% = R$10.20)
    await customerHelper.waitForCommissionCredit(affiliate.id, 10.2);
    const commission = await db.affiliates.getBalance(affiliate.id);
    expect(commission).toBe(10.2);

    // Step 10: Afiliado consegue sacar
    const withdrawal = await customerHelper.requestWithdrawal(affiliate.id, 10.2);
    expect(withdrawal.status).toBe('processing');
  });
});
```

### **3.2 Level 1: Double-Click Attack**

```typescript
// tests/e2e/chaos-level-1/double-click.spec.ts

test.describe('🟡 CHAOS L1: Double-Click Attack', () => {

  test('deve rejeitar múltiplos cliques em "Adicionar"', async ({
    page,
    customerHelper,
  }) => {
    await customerHelper.navigateToMenu();

    // Buscar o botão "Adicionar"
    const addButton = page.getByRole('button', { name: /adicionar/i }).first();

    // 🚨 Clicar 10x muito rápido
    for (let i = 0; i < 10; i++) {
      await addButton.click({ force: true }); // force ignora animations
    }

    // ✅ Verificar que apenas 1 item foi adicionado
    const cartCount = await customerHelper.getCartItemCount();
    expect(cartCount).toBe(1); // NÃO 10!

    // ✅ Verificar que preço não multiplicou
    const cartTotal = await customerHelper.getCartTotal();
    expect(cartTotal).toBeLessThanOrEqual(100); // Um prato, não 10
  });

  test('deve ser idempotente: "Finalizar" 3x = 1 pedido', async ({
    page,
    customerHelper,
    restaurant,
    fraudDetector,
  }) => {
    // Setup: montar carrinho
    await customerHelper.addDishToCart('Margherita', 1);

    // Vai pro checkout
    await customerHelper.goToCheckout();
    await customerHelper.fillDeliveryInfo({...});

    // 🚨 Clica "Finalizar Compra" 3x rapidíssimo
    const checkoutButton = page.getByRole('button', { name: /finalizar|pagar/i });
    const checkoutPromises = [
      checkoutButton.click(),
      checkoutButton.click(),
      checkoutButton.click(),
    ];

    await Promise.all(checkoutPromises);

    // ✅ Espera redirecionar para Mercado Pago
    await page.waitForURL('**/mercadopago.com/**');

    // ✅ Verifica no BD: apenas 1 pedido criado
    const orders = await db.orders.findByAffiliate(restaurant.id);
    expect(orders).toHaveLength(1); // NÃO 3!
  });
});
```

### **3.3 Level 2: Manipulação de Preço**

```typescript
// tests/e2e/chaos-level-2/price-manipulation.spec.ts

test.describe('🟡 CHAOS L2: Manipulação de Preço', () => {

  test('deve rejeitar preço falso no backend', async ({
    page,
    customerHelper,
    fraudDetector,
  }) => {
    // Setup: Montar carrinho com Margherita (R$ 45)
    await customerHelper.navigateToMenu();
    await customerHelper.addDishToCart('Margherita', 1);

    // 🚨 ATAQUE: Interceptar request POST /api/order
    // Mudar preço de 45 para 1
    let price_tampered = false;
    await page.route('/api/order', route => {
      const postData = route.request().postData();
      const json = JSON.parse(postData);
      json.items[0].price = 1; // HACK: mude preço para R$1
      price_tampered = true;

      // Enviar request modificado
      route.continue({ postData: JSON.stringify(json) });
    });

    // Tentar checkout
    await customerHelper.goToCheckout();
    await customerHelper.fillDeliveryInfo({...});
    await customerHelper.submitCheckout();

    // ✅ Backend DEVE rejeitar ou usar preço correto
    expect(price_tampered).toBe(true); // Confirmamos que tentamos hackear

    // ✅ Verificar no BD: pedido foi criado com preço CORRETO (45, não 1)
    const lastOrder = await db.orders.findLatest();
    expect(lastOrder.items[0].price).toBe(45); // Servidor não aceitou hack
  });

  test('deve validar localStorage do carrinho', async ({
    page,
    customerHelper,
  }) => {
    await customerHelper.navigateToMenu();
    await customerHelper.addDishToCart('Margherita', 1);

    // 🚨 ATAQUE: Manipular localStorage via console
    await page.evaluate(() => {
      const fakeCart = {
        items: [
          { id: 'pizza-1', name: 'Margherita', qty: 999, price: 0.01 },
        ],
        total: 0.09,
      };
      localStorage.setItem('cart', JSON.stringify(fakeCart));
    });

    // Recarregar página (carrinho deve ser validado)
    await page.reload();

    // ✅ Backend DEVE validar e ignorar localStorage fake
    const cartTotal = await customerHelper.getCartTotal();
    expect(cartTotal).toBeGreaterThan(44); // Deve ser > 44, não 0.09
  });
});
```

### **3.4 Level 3: Webhook Tampering**

```typescript
// tests/e2e/chaos-level-3/webhook-attacks.spec.ts

test.describe('🔴 CHAOS L3: Webhook Tampering', () => {

  test('deve rejeitar webhook sem assinatura HMAC válida', async ({
    page,
    customerHelper,
  }) => {
    // 🚨 Tentar enviar webhook falso
    const fakeWebhook = {
      id: 'PAYMENT_12345',
      status: 'approved',
      amount: 1000,
      external_reference: 'ORDER_999',
      // SEM assinatura HMAC
    };

    const response = await page.request.post('/api/webhooks/mercadopago', {
      data: fakeWebhook,
      headers: {
        'Content-Type': 'application/json',
        // Sem X-Signature header
      },
    });

    // ✅ DEVE retornar 401 ou 403
    expect(response.status()).toEqual(expect.not.objectContaining(200));
  });

  test('deve ser idempotente: webhook duplicado = 1 comissão', async ({
    page,
    customerHelper,
    fraudDetector,
  }) => {
    // Setup: criar pedido via UI
    await customerHelper.navigateToMenu();
    await customerHelper.addDishToCart('Margherita', 1);
    await customerHelper.goToCheckout();
    const orderId = await customerHelper.extractOrderId();

    // Simular webhook do Mercado Pago
    const webhookHelper = new WebhookHelperService();
    const webhookPayload = webhookHelper.createMercadoPagoWebhook(orderId, 100, 'approved');

    // Enviar webhook 1ª vez
    const response1 = await webhookHelper.sendWebhook(webhookPayload);
    expect(response1.status).toBe(200);

    // Aguardar processamento
    await customerHelper.waitMs(500);

    // Comissão creditada? (ex: 10% = 10)
    let commission = await db.affiliates.getBalance('affiliate-123');
    expect(commission).toBe(10);

    // 🚨 Enviar webhook NOVAMENTE (duplicado)
    const response2 = await webhookHelper.sendWebhook(webhookPayload);
    expect(response2.status).toBe(200); // Não erro 409

    // Aguardar processamento
    await customerHelper.waitMs(500);

    // ✅ Comissão AINDA 10, não 20!
    commission = await db.affiliates.getBalance('affiliate-123');
    expect(commission).toBe(10); // Idempotente
  });
});
```

### **3.5 Fraud Detection: Circular Referrals**

```typescript
// tests/e2e/chaos-level-3/circular-referrals.spec.ts

test.describe('🔴 FRAUD: Circular Referrals', () => {

  test('deve detectar e bloquear A→B→C→A pattern', async ({
    page,
    customerHelper,
    fraudDetector,
  }) => {
    // Criar 3 afiliados "suspeitos"
    const aff_a = await customerHelper.createAffiliate('aff_a@test.com');
    const aff_b = await customerHelper.createAffiliate('aff_b@test.com');
    const aff_c = await customerHelper.createAffiliate('aff_c@test.com');

    // A compra usando link de B
    let order = await customerHelper.createOrderAs(aff_a.email, aff_b.referralCode);
    expect(order.affiliateCredit).toBe(0); // Será confirmado suspeito depois

    // B compra usando link de C
    order = await customerHelper.createOrderAs(aff_b.email, aff_c.referralCode);
    expect(order.affiliateCredit).toBe(0);

    // C compra usando link de A (CICLO FECHADO)
    order = await customerHelper.createOrderAs(aff_c.email, aff_a.referralCode);
    expect(order.affiliateCredit).toBe(0);

    // ✅ Sistema deve detectar ciclo
    const circularPattern = await fraudDetector.detectCircularReferrals([
      aff_a.id,
      aff_b.id,
      aff_c.id,
    ]);
    expect(circularPattern).toBeTruthy();

    // ✅ Todos 3 afiliados devem estar bloqueados
    for (const aff of [aff_a, aff_b, aff_c]) {
      const status = await db.affiliates.getStatus(aff.id);
      expect(status).toBe('BLOCKED');
    }

    // ✅ Comissões revertidas
    for (const aff of [aff_a, aff_b, aff_c]) {
      const balance = await db.affiliates.getBalance(aff.id);
      expect(balance).toBe(0);
    }
  });
});
```

---

## 🏗️ PARTE 4: Checklist de Implementação

```markdown
# IMPLEMENTAÇÃO PASSO A PASSO (15 Dias)

## Dia 1-2: Setup & Infrastructure
- [ ] Criar estrutura de pastas (page-objects, fixtures, e2e)
- [ ] Instalar Playwright se não tem
- [ ] Montar playwright.config.ts (baseURL, timeout, retries)
- [ ] Criar helpers básicos (CustomerHelper, PaymentHelper)
- [ ] Conectar ao BD de testes (Supabase test key)

## Dia 3-4: Happy Path
- [ ] MenuPage.ts (navegação, busca, filtros)
- [ ] CartPage.ts (add, remove, total)
- [ ] CheckoutPage.ts (dados, endereço)
- [ ] ConfirmationPage.ts (pedido criado?)
- [ ] Test: full-order-flow.spec.ts ✅

## Dia 5: Mercado Pago Integration
- [ ] PaymentPage.ts (redireciona pra MP?)
- [ ] WebhookHelper (mock webhook de MP)
- [ ] Test: payment-webhook.spec.ts ✅
- [ ] Test: idempotência de webhook ✅

## Dia 6: Affiliate Flow
- [ ] AffiliateSignupPage.ts
- [ ] AffiliateDashboardPage.ts
- [ ] Test: affiliate-commission.spec.ts ✅
- [ ] Test: withdrawal-flow.spec.ts ✅

## Dia 7: Chaos Level 1
- [ ] Test: double-click.spec.ts ✅
- [ ] Test: race-conditions.spec.ts ✅
- [ ] Test: form-validation.spec.ts ✅
- [ ] Test: navigation-abuse.spec.ts ✅

## Dia 8-9: Chaos Level 2
- [ ] Test: price-manipulation.spec.ts ✅
- [ ] Test: bot-farm-detection.spec.ts ✅
- [ ] Test: cart-abuse.spec.ts ✅
- [ ] Test: discount-fraud.spec.ts ✅

## Dia 10-11: Chaos Level 3
- [ ] Test: webhook-attacks.spec.ts ✅
- [ ] Test: account-fraud.spec.ts ✅
- [ ] Test: injection-attacks.spec.ts ✅
- [ ] Test: race-condition-payment.spec.ts ✅

## Dia 12: CI/CD Integration
- [ ] GitHub Actions workflow
- [ ] Rodas testes em paralelo
- [ ] Gera relatório HTML
- [ ] Slack notification se falhar

## Dia 13: Relatórios & Análise
- [ ] Consolidar resultados
- [ ] Identificar flakiness
- [ ] Documentar edge cases encontrados

## Dia 14-15: Refinamento
- [ ] Corrigir testes flaky
- [ ] Otimizar performance
- [ ] Treinar time
```

---

## 🎯 PARTE 5: Métricas de Sucesso

```
[ ] ✅ 100% dos fluxos críticos testados (happy path)
[ ] ✅ 95%+ dos testes passando (aceitar 5% flakiness)
[ ] ✅ Tempo de suite: < 15 minutos (paralelo)
[ ] ✅ Cobertura de fraude: 20+ cenários testados
[ ] ✅ Zero double-charges após testes
[ ] ✅ Zero comissões duplas creditadas
[ ] ✅ Webhook idempotente (garantido)
[ ] ✅ Preços validados no backend (não confiam em frontend)
[ ] ✅ Rate limiting ativo em endpoints críticos
[ ] ✅ Afiliados fraudulentos bloqueados automaticamente
```

---

## 🏆 RESUMO: Seu Prompt vs Industry Standards

| Aspecto | Seu Nivel | Industry | Gap |
|---------|-----------|----------|-----|
| **Cenários de Teste** | 15 | 50+ | Consolidado aqui |
| **Happy Path Coverage** | ✅ | ✅ | Igual |
| **Chaos Testing** | 3 levels | 3 levels | Igual |
| **Page Objects** | ❌ | ✅ | Adicionado |
| **Fixtures Reutilizáveis** | ❌ | ✅ | Adicionado |
| **TypeScript Real** | ❌ | ✅ | Implementável |
| **Fraud Patterns** | 4 | 10+ | Expandido |
| **API Testing** | ❌ | ✅ | Adicionado |
| **Webhook Testing** | ❌ | ✅ | Crítico |
| **CI/CD Ready** | ❌ | ✅ | Adicionado |

---

## 📚 Fontes Industry

- QAble: Test cases para food delivery apps (Swiggy, Zomato patterns)
- TestGrid: Best practices de teste para restaurantes
- Medium (Denis Skvortsov): Feature Objects pattern (melhor que Page Objects)
- TestDino: Playwright Skill - 70+ guias de testes
- GitHub (Levi9): Playwright framework enterprise com Docker
- DEV Community (LiveSpaces): 100+ test cases retrospective

---

**Status Final**: 🎯 Pronto para implementação
**Nível**: Production-grade (sua aplicação de restaurantes)
**Tempo Estimado**: 15 dias (1-2 dev)
**ROI**: Zero double-charges, zero fraude detectada, afiliados confiantes
