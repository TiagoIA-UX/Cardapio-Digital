# Plano recomendado: Blog em subdominio (sem integrar no software principal)

Data: 2026-04-12
Status: recomendado para execucao em camadas, com baixo risco operacional.

## 1) Decisao arquitetural recomendada

Recomendacao principal: publicar o blog em subdominio dedicado (ex: blog.zairyx.com.br), com stack separada do produto.

Motivos:

- Isolamento de risco: o blog nao interfere no checkout, pagamento, webhook nem paines do SaaS.
- Deploy independente: time de conteudo publica sem tocar no core do produto.
- Seguranca: menor superficie de mudanca em rotas e dominios criticos.
- Escalabilidade editorial: trilha propria de SEO, analytics e workflow de publicacao.

## 2) Modelo operacional (mais saudavel)

Modelo sugerido:

- Produto principal: zairyx.com.br (sem alteracoes estruturais por causa do blog).
- Blog: blog.zairyx.com.br (projeto separado).
- Navegacao entre ambos por links canonicos e parametros UTM, sem acoplamento de codigo.

Regras de acoplamento minimo:

- Nao importar componentes do app principal no projeto do blog.
- Nao compartilhar banco transacional do checkout/pedidos com o blog.
- Nao mover rotas do app atual para comportar CMS.

## 3) SEO e distribuicao sem risco ao core

- Sitemap proprio do blog em blog.zairyx.com.br/sitemap.xml.
- Robots proprio do blog.
- Search Console com propriedade separada para o subdominio.
- Canonical por artigo apontando para URL final do proprio blog.
- Linkagem interna blog -> produto apenas por CTAs claros e transparentes.

## 4) Governanca de conteudo (integridade etica)

Seguir obrigatoriamente:

- Proibido dados inventados (depoimento, numero de clientes, benchmark sem fonte).
- Toda afirmacao de mercado com fonte auditavel.
- Cenarios ilustrativos sempre rotulados como simulacao.

## 5) Verificacao fiscal do sistema atual (sem alteracao de logica)

Estado validado hoje no codebase:

- Automacao fiscal nasce em modo seguro (default desabilitado e dry-run seguro).
- Emissao automatica so evolui para envio quando ha configuracao minima completa.
- NFC-e possui validacoes de CNPJ, CEP, codigo IBGE, endereco e itens.
- Documento do cliente (CPF/CNPJ) pode ser exigido por regra de ambiente.

Testes executados nesta validacao:

- tests/fiscal-automation.test.ts
- tests/fiscal-dispatch.test.ts
- tests/nfce-payload.test.ts
- tests/tax-document.test.ts

Resultado: 34/34 aprovados.

## 6) Regras a nosso favor (compliance e seguranca)

- Protocolo de protecao do projeto impede alteracoes arriscadas em nucleo de negocio sem autorizacao.
- Fluxos de pagamento/fiscal estao cobertos por testes e barreiras de configuracao.
- Estrategia de subdominio preserva estabilidade comercial do produto.

## 7) Proximo passo recomendado (sem tocar no software principal)

Fase 1 (rapida):

- Subir projeto separado do blog no subdominio.
- Configurar Search Console e analytics proprios do blog.
- Publicar 5-10 artigos pilares com fontes reais.

Fase 2 (tracao):

- Calendario editorial quinzenal.
- Cluster de conteudo por intencao de busca.
- CTAs de migracao para o produto principal com rastreio UTM.

Fase 3 (otimizacao):

- Atualizacao de artigos por queda de CTR/posicao.
- Testes A/B de titulo e meta description no blog.
- Relatorio mensal separado: trafego organico, leads, conversao para o produto.
