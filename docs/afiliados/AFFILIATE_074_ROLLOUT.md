# Rollout Operacional da Trava 084 de Afiliados

Objetivo: ativar a proteção estrutural contra comissão duplicada em `public.affiliate_referrals` no banco alvo e validar o comportamento real após a aplicação, agora com granularidade por plano.

## Quando usar

Use este procedimento quando o código já estiver com `onConflict: 'tenant_id,referencia_mes,plano'`, mas o banco ainda não tiver a trava única ativa.

## Pré-requisitos

- O patch idempotente em [lib/domains/core/mercadopago-onboarding-payment.ts](lib/domains/core/mercadopago-onboarding-payment.ts) deve estar presente.
- O auditor em [scripts/audit-affiliate-referrals-idempotency.ts](scripts/audit-affiliate-referrals-idempotency.ts) deve estar disponível.
- O probe em [scripts/probe-affiliate-idempotency-074.ts](scripts/probe-affiliate-idempotency-074.ts) deve estar disponível.
- Para o banco alvo atual, aplicar pelo SQL Editor do Supabase com `CREATE UNIQUE INDEX` sem `CONCURRENTLY`.
- A variante com `CONCURRENTLY` só deve ser usada fora do SQL Editor, em conexão SQL direta sem transaction block.

## Etapa 1. Auditoria prévia

No app local:

```bash
npx tsx scripts/audit-affiliate-referrals-idempotency.ts
```

Esperado:

- `duplicate_tenant_month_plan_pairs` vazio
- `can_apply_idempotency_guard = true`

Se houver qualquer duplicata, não aplique a trava antes de deduplicar.

## Etapa 2. Aplicação manual no Supabase

Abra o SQL Editor e rode o conteúdo de [docs/afiliados/apply_affiliate_074_manual.sql](docs/afiliados/apply_affiliate_074_manual.sql).

Ordem operacional:

1. Conferência de duplicatas.
2. Backfill de `referencia_mes` e `plano` quando ausentes.
3. Remoção do índice legado 074.
4. Criação do índice único compatível com o SQL Editor.
5. Comentário do índice.

No ambiente atual isso é seguro porque a auditoria está retornando `total_count = 0` para `affiliate_referrals`, então o lock do `CREATE UNIQUE INDEX` sem `CONCURRENTLY` é operacionalmente irrelevante.

## Etapa 3. Validação pós-aplicação

No app local:

```bash
npx tsx scripts/probe-affiliate-idempotency-074.ts
```

Esperado:

- `rows_for_month_with_distinct_plans = 2`
- `migration_084_effective = true`
- `cleanup_rows_remaining = 0`

`second_insert_error` deve vir como `23505` para a duplicata do mesmo tenant/mês/plano. O insert com plano alternativo deve continuar válido no mesmo mês. O sinal principal é o mês terminar com duas linhas legítimas, uma por plano.

Se futuramente a tabela crescer e a aplicação precisar minimizar lock de índice, use a variante com `CONCURRENTLY` fora do SQL Editor, por cliente SQL direto.

## Critério de liberação

Só considerar o fluxo de afiliado financeiramente protegido quando os dois pontos abaixo forem verdadeiros:

1. O código continuar registrando `created`, `duplicate ignored` e `error` corretamente.
2. O probe pós-aplicação confirmar `migration_084_effective = true`.

## Observação de arquitetura

Esta trava resolve o risco imediato de duplicação. Ela não muda o fato de a comissão ainda nascer no onboarding. A evolução futura, se desejada, é mover a criação da comissão para o evento financeiro final confirmado.
