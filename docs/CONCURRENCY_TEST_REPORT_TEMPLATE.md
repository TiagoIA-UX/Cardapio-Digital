# Relatório de Teste de Concorrência Financeira

Uso: preencher após teste real de concorrência entre webhook do Mercado Pago e cron de reconciliação.

Nome sugerido do arquivo final:

`CONCURRENCY_TEST_REPORT_YYYY-MM-DD.md`

## 1. Identificação

- Ambiente: Production / Preview
- Commit SHA:
- Migration 071 aplicada: SIM / NÃO
- Data do teste:
- Responsável:

## 2. Dados do Teste

- `order_id`:
- `delivery_payment_id`:
- `mp_payment_id`:
- Timestamp da aprovação no Mercado Pago:
- Timestamp do disparo manual do cron:
- Intervalo estimado entre webhook real e cron manual:

## 3. Resultado Esperado

| Critério                               | Resultado observado | PASS / FAIL |
| -------------------------------------- | ------------------- | ----------- |
| Apenas uma execução adquiriu lock      |                     |             |
| Nenhum `finalizing = true` ficou preso |                     |             |
| Pagamento finalizado uma vez           |                     |             |
| Pedido confirmado                      |                     |             |
| Metadata preservada                    |                     |             |
| Sem erro crítico no Sentry             |                     |             |

## 4. Evidência SQL

### 4.1 Estado final do pagamento

```sql
select
  id,
  order_id,
  status,
  mp_payment_id,
  metadata->>'finalizing' as finalizing,
  metadata->>'finalize_source' as finalize_source,
  metadata->>'finalize_last_run_at' as finalize_last_run_at,
  metadata->>'mp_status' as mp_status,
  paid_at
from delivery_payments
where order_id = 'ORDER_ID_DO_TESTE';
```

Resultado colado:

```sql
-- cole aqui
```

### 4.2 Pagamentos presos

```sql
select
  id,
  order_id,
  status,
  metadata->>'finalizing' as finalizing,
  updated_at
from delivery_payments
where metadata->>'finalizing' = 'true'
order by updated_at desc;
```

Resultado colado:

```sql
-- cole aqui
```

### 4.3 Logs do cron

```sql
select
  level,
  message,
  metadata->>'execution_id' as execution_id,
  metadata->>'status' as status,
  metadata->>'total_processados' as total_processados,
  metadata->>'total_finalizados' as total_finalizados,
  metadata->>'total_erros' as total_erros,
  created_at
from domain_logs
where message ilike '%reconciliação de pagamentos delivery%'
order by created_at desc
limit 20;
```

Resultado colado:

```sql
-- cole aqui
```

## 5. Evidência Operacional

- Cron respondeu `200`: SIM / NÃO
- Webhook real do MP recebido: SIM / NÃO
- Execução apareceu no dashboard da Vercel: SIM / NÃO
- Evento crítico apareceu no Sentry: SIM / NÃO / NÃO APLICÁVEL
- `finalize_source` final: webhook / cron / outro

## 6. Conclusão

- Resultado final: PASS / FAIL
- Observações:
- Riscos remanescentes identificados:

## 7. Gate de Liberação

Este teste só pode ser considerado aprovado se:

- nenhuma linha permanecer com `finalizing = true`
- apenas uma finalização efetiva ocorrer
- pagamento e pedido terminarem em estado consistente
- metadata financeira permanecer íntegra
- não houver erro crítico inesperado em produção

Decisão:

- Gate financeiro aprovado: SIM / NÃO
- Próximo passo autorizado: staging formal / nova rodada de teste / correção adicional
