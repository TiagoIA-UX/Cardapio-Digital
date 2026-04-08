# PROTOCOLO DE AUTOMACAO TOTAL E DIRECAO ZAEA

> Status: ativo
> Escopo: site, painel, fluxos automaticos, IA operacional e evolucao do ZAEA

Este documento complementa o protocolo principal do repositório e registra a direção permanente do produto para evitar desvios de arquitetura, UX e operação.

## 1. Direcao principal do produto

O Cardapio Digital deve evoluir para uma operacao cada vez mais automatica.

Objetivo:

- reduzir dependencia de contato manual
- reduzir intervencao operacional humana
- preservar clareza para o cliente
- transformar manutencao, suporte e deteccao de problemas em rotinas automaticas

## 2. Regra de UX e fluxo comercial

Em site e painel, a preferencia deve ser sempre por fluxo automatico.

Portanto:

- evitar blocos consultivos, comerciais ou manuais que desviem o cliente para atendimento humano como caminho principal
- evitar CTAs que criem dependencia de equipe para destravar crescimento comum do produto
- preferir mensagens que expliquem o que o sistema faz automaticamente
- contato humano deve existir apenas como excecao, bastidor tecnico ou contingencia

## 3. Regra para planos e upgrades

Upgrade de plano deve comunicar de forma simples e automatica:

- o canal digital atual permanece preservado
- o editor permanece preservado
- o catalogo atual permanece preservado
- o upgrade apenas amplia capacidades do plano, como quantidade de produtos cadastraveis

Nao transformar limites altos em promessa comercial manual dentro do fluxo principal do painel.

## 4. Papel do ZAEA

O ZAEA e a direcao operacional e tecnica da plataforma para defeitos operacionais.

Escopo esperado:

- detectar defeitos operacionais em toda a plataforma
- diagnosticar causa provavel
- validar risco da intervencao
- corrigir automaticamente quando for seguro
- validar a propria correcao antes de concluir
- escalar para humano apenas quando a correcao automatica nao for segura ou suficiente

Direcao de maturidade:

1. detectar
2. diagnosticar
3. notificar
4. corrigir automaticamente com seguranca
5. validar e aprender com a ocorrencia

## 5. Escalonamento humano

Escalonamento humano nao e proibido, mas nao deve ser a espinha dorsal do produto.

Regra:

- humano como excecao
- automacao como padrao
- correcao segura como alvo

## 6. Compatibilidade com o protocolo principal

Este documento nao substitui o arquivo principal de protecao do repositório.

Fonte principal de governanca:

- .github/copilot-instructions.md

Este documento serve como direcao de produto e operacao para futuras evolucoes.

## 7. Regra pratica para futuras alteracoes

Antes de adicionar nova copy, CTA, automacao, upgrade, agente ou fluxo de suporte, validar:

1. Isso aumenta a automacao ou cria dependencia manual?
2. Isso preserva a operacao validada atual?
3. Isso empurra contato humano cedo demais?
4. Isso aproxima o ZAEA de detectar e corrigir defeitos operacionais com seguranca?

Se a resposta contrariar a automacao total como direcao principal, a mudanca deve ser reconsiderada.
