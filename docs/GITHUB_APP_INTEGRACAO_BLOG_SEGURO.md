# GitHub App para integrar blog com seguranca (padrao ForgeOps AI)

Objetivo: operar integracoes entre repositorios usando GitHub App (sem PAT pessoal), com escopo minimo e token curto por instalacao.

## O que foi adicionado neste repo

- scripts/lib/github-app-auth.mjs
- scripts/github-app-token.mjs
- scripts/github-app-grant-repo-access.mjs
- scripts/github-app-dispatch-blog-sync.mjs
- scripts/github-app-export-template.mjs
- scripts/github-app-create-mp-checkout.mjs
- templates/github-app-blog-integration/
- scripts npm no package.json:
  - github:app:token
  - github:app:grant
  - github:app:dispatch:blog
  - github:app:export-template
  - github:app:sell:mp

## Variaveis de ambiente necessarias

- GITHUB_APP_ID
- GITHUB_APP_PRIVATE_KEY
  - formato recomendado: chave PEM com \n escapado
- opcional: GITHUB_APP_PRIVATE_KEY_BASE64
  - se usar esta, ela tem prioridade
- opcional: GITHUB_TARGET_REPO
  - ex: TiagoIA-UX/Cardapio-Digital

## Como criar o GitHub App

1. GitHub > Settings > Developer settings > GitHub Apps > New GitHub App.
2. Defina callback URL e webhook URL do seu backend (se for usar eventos).
3. Permissoes recomendadas para integracao de blog multi-repo:
   - Repository metadata: Read-only
   - Contents: Read and write
   - Pull requests: Read and write
   - Actions: Read and write (se for acionar workflows)
   - Administration: Read and write (somente se for convidar colaboradores)
4. Instale o App nos repositorios destino.
5. Salve App ID e Private Key no ambiente (nunca em codigo).

## Comandos principais

### 1) Validar token de instalacao

npm run github:app:token -- --repo TiagoIA-UX/Cardapio-Digital

Para depuracao (nao usar em logs publicos):

npm run github:app:token -- --repo TiagoIA-UX/Cardapio-Digital --print-token

### 2) Conceder acesso de colaborador com App (dry-run por padrao)

npm run github:app:grant -- --repo TiagoIA-UX/Cardapio-Digital --github-user usuario-alvo

Aplicar de verdade:

npm run github:app:grant -- --repo TiagoIA-UX/Cardapio-Digital --github-user usuario-alvo --permission pull --apply

### 3) Disparar integracao de blog em qualquer app via repository_dispatch (dry-run por padrao)

npm run github:app:dispatch:blog -- --repo owner/app-repo --blog-repo TiagoIA-UX/zairyx-blog --path-prefix content/blog

Aplicar de verdade:

npm run github:app:dispatch:blog -- --repo owner/app-repo --blog-repo TiagoIA-UX/zairyx-blog --event blog_sync_request --apply

## Fluxo recomendado de seguranca

1. App com escopo minimo por ambiente.
2. Instalacao separada por grupo de repositorios.
3. Tokens de instalacao curtos, gerados sob demanda.
4. Dry-run obrigatorio antes de --apply.
5. Logs sem expor token.
6. Rotacao de private key periodica.

## Comercializacao: gerar checkout Mercado Pago do produto

Gerar link de pagamento para vender a integracao como servico/produto:

npm run github:app:sell:mp -- --title "Integracao GitHub App Zairyx" --price 2997 --quantity 1

Parametros uteis:

- `--description`
- `--currency` (padrao: BRL)
- `--success-url`
- `--pending-url`
- `--failure-url`
- `--email` e `--name` (payer opcional)

O script usa `MERCADO_PAGO_ACCESS_TOKEN` ou `MERCADOPAGO_ACCESS_TOKEN` carregando automaticamente `.env.local`.

## Como usar para integrar blog em qualquer aplicacao

1. Repositorio da aplicacao recebe evento repository_dispatch.
2. Workflow da aplicacao escuta event_type blog_sync_request.
3. Workflow baixa conteudo do repo do blog e abre PR de atualizacao.
4. Merge com revisao e trilha de auditoria.

Esse padrao permite replicar o mesmo processo em qualquer novo app sem compartilhar PAT pessoal.

## Exportar pacote template pronto

Gerar pacote reutilizavel com scripts + workflow + env example:

npm run github:app:export-template

Opcional: definir pasta de saida.

npm run github:app:export-template -- --output private/github-app-template-custom

Saida padrao:

- private/github-app-blog-integration-export/template/*
- private/github-app-blog-integration-export/scripts/*
- private/github-app-blog-integration-export/QUICKSTART.md
