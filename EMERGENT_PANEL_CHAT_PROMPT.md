# Emergent.sh — Teste Focado do Chat do Painel

Objetivo: validar apenas a correção do assistente flutuante no painel, garantindo que ele aja como ajuda operacional do painel, e não como chat comercial da Zairyx.

## Ambiente

- URL base: http://localhost:3000
- Página alvo: http://localhost:3000/painel
- Navegador: Chromium
- Não use "loacalhost". Use exatamente "localhost".

## O que validar

1. Acessar /painel e localizar o chat flutuante.
2. Abrir o chat e verificar a mensagem inicial.
3. Confirmar que o texto inicial fala sobre ajuda com painel, por exemplo:
   - editar canal digital
   - cadastrar produtos
   - ajustar categorias
   - QR Code
   - pedidos
   - configurações
4. Confirmar que o chat do painel nao inicia com discurso comercial.
5. Confirmar que ele nao oferece proativamente:
   - planos
   - preços
   - upgrade
   - remoção de marca
6. Clicar em respostas rápidas, se existirem, e verificar se são orientadas ao uso do painel.
7. Enviar perguntas curtas e validar o comportamento:
   - "Onde cadastro produtos?"
   - "Como trocar logo e banner?"
   - "Nao sei por onde começar"
8. Verificar se as respostas são curtas, práticas e em tom de suporte operacional.
9. Confirmar que as respostas indicam caminhos de tela do painel quando apropriado.

## O que nao testar neste roteiro

- Checkout
- Mercado Pago
- onboarding
- páginas públicas de venda
- fluxo do cardápio público /r/[slug]

## Critérios de aprovação

- O chat em /painel se apresenta como assistente do painel.
- O chat responde como suporte operacional, nao como vendedor.
- Nao aparecem menções proativas a preço, plano, upgrade ou remoção de marca.
- As respostas ajudam a executar tarefas reais do painel.
- A navegação usa localhost corretamente e a página carrega sem erro de DNS.

## Relatório esperado

Responder com:

- Status final: aprovado ou reprovado
- Resultado de cada validação
- Texto exato da saudação inicial do chat
- Exemplos curtos das respostas para as 3 perguntas testadas
- Se houve qualquer menção comercial indevida
- Se houve qualquer erro de carregamento, console ou rede