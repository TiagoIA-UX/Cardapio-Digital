# Anomalias de Migrations

Objetivo: registrar anomalias históricas do diretório [supabase/migrations](supabase/migrations) que não devem ser “corrigidas” por renomeação retroativa.

## Estado atual

- Gap `029`: ausente localmente e ausente no histórico remoto conhecido. Tratar como lacuna histórica inofensiva, não como migration perdida a ser recriada.
- Duplicata `035`: existem os arquivos [supabase/migrations/035_idempotent_increment_template_sales.sql](supabase/migrations/035_idempotent_increment_template_sales.sql) e [supabase/migrations/035_payout_validation_and_exports.sql](supabase/migrations/035_payout_validation_and_exports.sql).
- Duplicata `040`: existem os arquivos [supabase/migrations/040_order_payment_receipt.sql](supabase/migrations/040_order_payment_receipt.sql) e [supabase/migrations/040_system_alerts_notified_python.sql](supabase/migrations/040_system_alerts_notified_python.sql).

## Contexto histórico

- Parte da evolução do schema ocorreu fora do fluxo normal da Supabase CLI.
- O schema remoto foi reconciliado posteriormente via `supabase migration repair`, sem renomear migrations antigas.
- A tabela de histórico remoto registra uma única versão `035` e uma única versão `040`, enquanto o diretório local possui duas migrations para cada versão.

## Decisão operacional

- Não renomear nem editar migrations históricas já existentes.
- Aceitar `035` e `040` como dívida histórica documentada.
- Usar o schema real e os probes de banco como fonte de verdade para validação estrutural.

## Regra permanente de deploy

- Nunca rodar `supabase db push` sem antes executar `supabase migration list`.
- O estado aceitável do `migration list` é:
  - alinhamento completo entre `LOCAL` e `REMOTE` para as versões lineares
  - sobras locais apenas nas duplicatas históricas `035` e `040`
- Se aparecer qualquer outra migration `LOCAL` sem `REMOTE`, parar e investigar antes do deploy.

## Observação para auditoria futura

- Se houver necessidade de saneamento total do histórico, isso deve ser tratado como projeto específico de migração/reindexação histórica, com plano de rollback e sem alterar retroativamente arquivos já aplicados em produção.
