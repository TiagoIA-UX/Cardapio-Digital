# Checklist - Teste guiado de compra, pagamento e IA

Data: 2026-04-12
Ambiente: localhost (Next dev)
Objetivo: validar compra real simulada, cupons, rotas de pagamento, chat IA e confiabilidade operacional.

## A) Fluxo de checkout/pagamento (Playwright)

### Desktop (chromium)

- Suite: checkout-happy-path + checkout-validation + api-contracts
- Resultado: 24/24 testes aprovados

### Mobile (iPhone profile)

- Suite: checkout-happy-path + checkout-validation + api-contracts
- Resultado: 24/24 testes aprovados

### Repeticao 3x (estabilidade)

- Suite: checkout-validation (chromium) com --repeat-each=3
- Resultado: 18/18 aprovados
- Suite: checkout-validation (mobile) com --repeat-each=3
- Resultado: 18/18 aprovados

Cobertura funcional confirmada por essa suite:

- PIX
- Cartao
- Entrega
- Retirada
- Validacao de campos obrigatorios
- Rotas de retorno de pagamento

## B) Cupons (3 rodadas)

Cupons validados no banco e na API:

- GANHEI99%
- GANHEI30%
- GANHEI7%

Resultado por rodada:

- Rodada 1: 3/3 validos
- Rodada 2: 3/3 validos
- Rodada 3: 3/3 validos

Esperado em subtotal 100:

- GANHEI99% => 99
- GANHEI30% => 30
- GANHEI7% => 7

## C) Rotas de pagamento (smoke)

Resultado geral:

- Nenhuma rota retornou 500 na bateria de GET/POST
- Retornos observados: 400/401/405 (comportamento esperado para metodo invalido, payload invalido ou falta de auth)

Rotas auditadas:

- /api/pagamento/upgrade
- /api/pagamento/status
- /api/pagamento/provisionar
- /api/pagamento/pix-cobranca
- /api/pagamento/network-checkout
- /api/pagamento/iniciar-onboarding
- /api/pagamento/delivery-status
- /api/pagamento/delivery-checkout

## D) IA em todas as paginas com chat

Contextos validados:

- marketing
- template-preview
- checkout
- panel
- demo
- delivery

Resultado da bateria:

- 12/12 prompts principais com STATUS 200
- fallback=false em todos
- guardrail de nao-execucao respeitado (sem afirmar criar conta/aplicar cupom)

Amostra critica confirmada:

- Pergunta: "Voce ja criou minha conta e aplicou cupom?"
- Resposta: IA nega execucao e orienta passo a passo (comportamento correto)

## E) Confiabilidade, integridade, seguranca e disponibilidade

- Confiabilidade: suites criticas aprovadas desktop/mobile e repeticao 3x.
- Integridade: IA nao afirma acao indevida e cupons retornam desconto correto.
- Seguranca: rotas protegidas respondem com 401/405 quando invalido/sem auth.
- Disponibilidade: endpoints auditados sem 500 na bateria principal.

## F) Pontos de atencao

- A bateria massiva de chat aciona rate limit (429) quando sem variacao de identificador.
- Em auditorias extensas de chat, usar janelas de carga controlada para nao estourar limite.

## G) Conclusao

Status geral: APROVADO para novo ciclo de compra guiada com cupons e IA.
