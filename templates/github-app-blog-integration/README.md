# Template: Integracao Blog via GitHub App

Template profissional para integrar conteudo de blog entre repositorios com seguranca, usando token de instalacao (curto prazo) de GitHub App, sem PAT pessoal.

## Objetivo

Padronizar um fluxo reproduzivel para qualquer aplicacao:

1. Disparo de `repository_dispatch` no repo da aplicacao.
2. Workflow receptor baixa conteudo do blog de origem.
3. Workflow sincroniza para o caminho de destino.
4. Workflow abre PR automatizado para revisao e merge seguro.

## Estrutura do template

- `workflows/blog-sync-receiver.yml`: workflow receptor pronto para uso.
- `.env.github-app.example`: variaveis obrigatorias para scripts locais.
- `package-scripts.snippet.json`: bloco de scripts npm para copiar no repo destino.

## Permissoes recomendadas do GitHub App

- Repository metadata: Read-only
- Contents: Read and write
- Pull requests: Read and write
- Actions: Read and write (somente se for disparar workflows)
- Administration: Read and write (apenas se for convidar colaboradores)

## Secrets recomendados no repo receptor

- `BLOG_REPO`: ex. `TiagoIA-UX/zairyx-blog`
- `BLOG_REF`: ex. `main`
- `BLOG_CONTENT_PATH`: ex. `content/blog`
- `APP_CONTENT_PATH`: ex. `content/blog`

## Fluxo operacional

1. Rode dry-run local do dispatch.
2. Valide payload e permissao.
3. Execute com `--apply`.
4. Revise PR aberto pelo workflow receptor.

## Opcional: monetizacao via Mercado Pago

Se quiser vender a integracao como produto/servico, use no repositorio que contem os scripts:

`npm run github:app:sell:mp -- --title "Integracao GitHub App" --price 2997`

Esse comando gera `initPoint` para checkout com credenciais Mercado Pago configuradas no ambiente.

## Regras de seguranca

- Nunca versionar private key do GitHub App.
- Nunca expor token de instalacao em logs.
- Usar escopo minimo de permissoes.
- Rotacionar private key periodicamente.
- Sempre testar com dry-run antes de `--apply`.
