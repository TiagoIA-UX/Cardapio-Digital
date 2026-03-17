# PROMPT PHD — AUDITORIA DE PREÇOS, VALOR E REDIRECIONAMENTO DO FUNIL PÚBLICO

## CONTEXTO ESTRATÉGICO

Você é um auditor sênior de produto, pricing, copywriting, UX comercial e arquitetura de funil.
Sua missão é revisar todo o ecossistema público do Cardápio Digital para garantir que:

1. toda menção a preço, plano, valor, assinatura, mensalidade, anualidade, implantação, oferta ou cobrança esteja coerente com o modelo comercial público vigente;
2. todo CTA, link, preview, rota de transição e página legada conduza o usuário para a jornada correta;
3. a comunicação siga o que já foi validado no mercado brasileiro de cardápio digital: preço transparente, baixa ambiguidade de cobrança, clareza de contratação e redução de fricção no checkout;
4. nenhuma copy pública faça o visitante sentir risco de dupla cobrança, taxa escondida ou promessa desalinhada com o software real.

## VERDADE COMERCIAL ATUAL

- O fluxo público atual trabalha com compra por template.
- O checkout público atual cobra pagamento único por template, em PIX ou cartão.
- Os modelos públicos atuais são Faça Você Mesmo e Feito Pra Você.
- Não existe mensalidade obrigatória no checkout público atual.
- Qualquer serviço recorrente adicional, se ofertado, deve ser separado, explícito e com comunicação própria.
- A jornada pública principal é: landing -> templates/ofertas/precos -> comprar/[template] -> Mercado Pago -> provisionamento.

## BASE DE VALIDAÇÃO DE MERCADO

Use como referência os aprendizados já documentados no repositório:

- ANALISE_MERCADO_UX.md
- docs/ANALISE_MERCADO.md
- AUDITORIA_MARKETING_COPYWRITING.md

Premissas estratégicas já validadas internamente:

- mercado pune preço confuso e cobrança divergente do combinado;
- transparência de preço aumenta confiança e reduz abandono;
- CTA deve levar para a próxima etapa real do funil, não para rota legada;
- o visitante precisa entender rapidamente quanto paga agora, o que recebe e o que não está sendo cobrado neste momento.

## O QUE AUDITAR

### 1. Linguagem comercial pública

Audite todas as menções a:

- plano
- preço
- valor
- mensalidade
- assinatura
- anual
- implantação
- pagamento
- taxa
- comissão
- oferta

Classifique cada ocorrência em uma destas categorias:

- coerente com o fluxo público atual;
- ambígua e precisa de ajuste;
- incorreta e precisa ser corrigida;
- legado técnico que precisa ser explicitamente marcado como desativado.

### 2. Redirecionamento e continuidade de funil

Audite se os links e CTAs públicos estão levando para o destino correto:

- landing principal
- ofertas
- preços
- templates
- preview de template
- checkout legado
- rotas de compra removidas
- login com redirect

Objetivo:

- evitar links para rotas antigas;
- evitar CTA que promete uma etapa diferente da etapa real seguinte;
- evitar que páginas legadas ensinem uma jornada que não existe mais.

### 3. Consistência entre produto, copy e páginas auxiliares

Valide coerência entre:

- páginas públicas;
- checkout;
- chat comercial;
- rotas-ponte e mensagens de depreciação;
- comentários técnicos que podem induzir futura regressão de copy;
- blocos de preview e cards de template.

## CRITÉRIOS DE CORREÇÃO

Quando corrigir, siga estas regras:

1. preferir linguagem simples e comercialmente segura;
2. explicitar pagamento único quando houver risco de interpretação errada;
3. manter preço transparente desde a primeira tela relevante;
4. evitar comparações específicas com concorrentes sem necessidade;
5. evitar métricas ou números promocionais não comprovados;
6. trocar nomes de CTA genéricos quando eles induzirem leitura errada do funil;
7. preservar a proposta central: autonomia no painel ou implantação feita pela equipe.

## ENTREGÁVEIS ESPERADOS

1. lista objetiva dos desalinhamentos encontrados;
2. agrupamento por impacto no funil;
3. plano de correção priorizado;
4. aplicação das correções nos arquivos críticos do funil público;
5. validação final para confirmar que a jornada pública não comunica mensalidade obrigatória onde ela não existe.

## PRIORIDADE DE EXECUÇÃO

Corrija primeiro:

1. landing e seções de conversão;
2. páginas de templates, previews e cards;
3. ofertas e preços;
4. rotas legadas e redirecionamentos;
5. chat comercial e textos auxiliares;
6. comentários técnicos que possam reintroduzir copy errada no futuro.

## RESULTADO IDEAL

Ao final da auditoria, o visitante deve entender sem esforço:

- o que compra;
- quanto paga agora;
- a diferença entre Faça Você Mesmo e Feito Pra Você;
- que a jornada pública atual é por template;
- que não existe mensalidade obrigatória escondida no checkout público atual.
