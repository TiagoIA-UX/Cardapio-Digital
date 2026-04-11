# Deploy Guardrails e Handoff ForgeOps (2026-04-11)

## Objetivo

Evitar repeticao dos travamentos de deploy e padronizar um fluxo seguro para upgrade/deploy na main.

## Causas-raiz identificadas

1. Modulo faltante no commit de producao

- Erro observado: `Module not found: Can't resolve '@/lib/domains/marketing/home-template-catalog'`.
- Causa: arquivo existia localmente, mas ficou untracked e nao entrou no push.
- Correcao aplicada: commit hotfix com o arquivo faltante na main.

1. Workspace local sujo e divergado da main remota

- Efeito: push rejeitado por non-fast-forward e alto risco de publicar alteracoes nao auditadas.
- Correcao aplicada: publicacao via worktree limpo baseado em `origin/main`.

1. Ambiente local de dependencias inconsistente

- Sintoma: build local com Next 15 enquanto `package.json` pedia Next 16.1.7.
- Efeito: erros falsos/ruidosos de `PageNotFoundError` no build local.
- Correcao aplicada: reinstalacao limpa de dependencias e validacao de build com Next 16.1.7.

1. Travas de arquivos no Windows (`EPERM`/`Access denied`)

- Efeito: falha ao remover `node_modules` e limpeza parcial.
- Correcao aplicada: encerrar processos Node e repetir limpeza/reinstalacao.

## Estado atual de seguranca para upgrade normal

## OK (confirmado)

1. Main remota contem os hotfixes de branding e modulo faltante.
2. Build local com Next 16.1.7 compila e gera rotas corretamente.
3. Rotas admin/afiliados/cron aparecem novamente na tabela de build apos alinhar dependencias.

## Pendencias observadas

1. Lint local apontou erros existentes de hooks/strings nao escapadas em paginas especificas.
2. Smoke E2E de landing mostrou 3 falhas por divergencia de expectativa de produto:

- CTA principal agora aponta para `/quanto-posso-lucrar` (nao `/templates`).
- Teste de carousel de testimonials esta desatualizado frente ao DOM atual.

Esses itens nao bloqueiam o hotfix do modulo faltante, mas devem ser tratados no proximo ciclo de hardening.

## Protocolo anti-reincidencia (obrigatorio)

1. Antes de commit/push

- `git status --short` deve estar limpo (exceto arquivos gerados conhecidos).
- `git fetch origin && git rev-parse --short HEAD && git rev-parse --short origin/main`.
- Se houver divergencia e sujeira local, publicar via worktree limpo.

1. Preflight minimo de deploy

- `npm ci --no-audit --no-fund`
- `npm run build`
- `npm run lint`

1. Checagem de arquivos criticos importados

- Sempre validar que novos modulos importados estao rastreados no git:
  - Exemplo: `git ls-files lib/domains/marketing/home-template-catalog.ts`

1. Em Windows (quando houver EPERM)

- Encerrar processos travando binarios antes de limpar dependencias:
  - `taskkill /F /IM node.exe`
- Repetir limpeza e reinstall.

1. Deploy

- Nao usar Vercel CLI para deploy neste projeto.
- Deploy apenas por push na `main` (GitHub Integration).

## Handoff direto para ForgeOps

ForgeOps deve executar este checklist em toda mudanca de release:

1. Integridade de branch

- Confirmar HEAD == `origin/main` no contexto de release.

1. Integridade de dependencia

- Confirmar `next` instalado == versao declarada no `package.json`.

1. Integridade de build

- Build obrigatorio verde antes de qualquer acao de upgrade.

1. Integridade de testes

- Rodar pelo menos smoke de seguranca + conversao.
- Se falhar por mudanca intencional de produto (ex.: destino de CTA), abrir tarefa de atualizacao de teste no mesmo ciclo.

1. Relatorio de saida

- Publicar resumo curto com:
  - Commit analisado
  - Build status
  - Lint status
  - Smokes executados
  - Bloqueios e acao recomendada

## Observacao final

Este documento registra o que causou os travamentos recorrentes e estabelece um fluxo pratico para prevenir nova recorrencia sem reduzir velocidade de entrega.
