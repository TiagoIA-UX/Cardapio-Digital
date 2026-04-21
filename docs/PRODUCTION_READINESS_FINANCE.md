# Checklist de Prontidão de Produção Financeira

Uso: preencher antes de liberar mudanças que impactem pagamento, webhook, cron, reconciliação ou RPCs financeiras.

Status final:

- PASS: todos os itens críticos aprovados
- FAIL: qualquer item crítico reprovado ou não verificado

Data da validação: \_**\_/\_\_**/**\_\_\_\_**

Responsável: **************\_\_**************

Commit / tag validada: **********\_**********

Ambiente: produção

## 1. Banco e Migrations

| Item                                                                  | Resultado   | Evidência |
| --------------------------------------------------------------------- | ----------- | --------- |
| Migration `071_delivery_payment_atomic_lock.sql` aplicada no Supabase | PASS / FAIL |           |
| `acquire_delivery_payment_lock` visível em Database → Functions       | PASS / FAIL |           |
| `release_delivery_payment_lock` visível em Database → Functions       | PASS / FAIL |           |
| `acquire_delivery_payment_lock(uuid)` retorna linha quando livre      | PASS / FAIL |           |
| Segunda chamada de acquire retorna vazio                              | PASS / FAIL |           |
| `release_delivery_payment_lock(uuid)` libera corretamente             | PASS / FAIL |           |
| `delivery_payments.status` mantém CHECK constraint válida             | PASS / FAIL |           |
| FK entre pagamento e pedido ativa                                     | PASS / FAIL |           |
| RLS não bloqueia RPCs internas                                        | PASS / FAIL |           |
| Não existe pagamento aprovado com pedido em estado inconsistente      | PASS / FAIL |           |

## 2. Metadata Financeira

Validar após uma finalização real ou controlada:

| Item                                             | Resultado   | Evidência |
| ------------------------------------------------ | ----------- | --------- |
| `mp_status` presente                             | PASS / FAIL |           |
| `finalize_last_run_at` presente                  | PASS / FAIL |           |
| `finalize_source` presente                       | PASS / FAIL |           |
| `finalizing` sempre retorna para `false`         | PASS / FAIL |           |
| Metadata não perde campos após liberação do lock | PASS / FAIL |           |

## 3. Cron e Reconciliação

| Item                                               | Resultado   | Evidência |
| -------------------------------------------------- | ----------- | --------- |
| Cron aparece no dashboard Vercel                   | PASS / FAIL |           |
| Frequência real confirmada                         | PASS / FAIL |           |
| Primeira execução retornou `200`                   | PASS / FAIL |           |
| `execution_id` registrado em `domain_logs`         | PASS / FAIL |           |
| `started_at` e `finished_at` registrados           | PASS / FAIL |           |
| `duration_ms` coerente com o timeout do provedor   | PASS / FAIL |           |
| `status` registrado (`success`, `partial`, `fail`) | PASS / FAIL |           |
| Contadores da execução corretos                    | PASS / FAIL |           |
| Reconciliação roda 3 ciclos consecutivos sem erro  | PASS / FAIL |           |

## 4. Concorrência Controlada

Executar webhook manual e cron manual em sequência imediata ou simultânea.

| Item                                      | Resultado   | Evidência |
| ----------------------------------------- | ----------- | --------- |
| Apenas uma finalização efetiva ocorre     | PASS / FAIL |           |
| Lock impede duplicação                    | PASS / FAIL |           |
| `finalizeDeliveryPayment` aborta sem lock | PASS / FAIL |           |
| Webhook repetido não duplica atualização  | PASS / FAIL |           |
| Cron repetido não duplica atualização     | PASS / FAIL |           |

## 5. Webhook e Pagamento

| Item                                              | Resultado   | Evidência |
| ------------------------------------------------- | ----------- | --------- |
| Endpoint do webhook protegido e respondendo `200` | PASS / FAIL |           |
| Validação de assinatura ativa                     | PASS / FAIL |           |
| Idempotência do webhook confirmada                | PASS / FAIL |           |
| Cron reconcilia quando webhook não chega          | PASS / FAIL |           |
| Divergência de valor é bloqueada                  | PASS / FAIL |           |

## 6. Observabilidade e Alertas

| Item                                                 | Resultado   | Evidência |
| ---------------------------------------------------- | ----------- | --------- |
| `NEXT_PUBLIC_SENTRY_DSN` configurado em produção     | PASS / FAIL |           |
| Erro manual aparece no dashboard do Sentry           | PASS / FAIL |           |
| Ambiente `production` visível no Sentry              | PASS / FAIL |           |
| Stack trace completo disponível                      | PASS / FAIL |           |
| Fallback para `system_alerts` funcionando            | PASS / FAIL |           |
| Ausência de `ALERT_WEBHOOK_URL` tratada como warning | PASS / FAIL |           |
| `notifyCronFailure()` dispara apenas em falha total  | PASS / FAIL |           |
| `/api/cron/health` responde OK                       | PASS / FAIL |           |
| Nenhum pagamento fica preso com `finalizing = true`  | PASS / FAIL |           |

## 7. Deploy e Rollback

| Item                                                       | Resultado   | Evidência |
| ---------------------------------------------------------- | ----------- | --------- |
| `npm run build` passa localmente                           | PASS / FAIL |           |
| Deploy automático via `git push` funcionando               | PASS / FAIL |           |
| Variáveis críticas presentes no dashboard Vercel           | PASS / FAIL |           |
| Rollback manual na Vercel conhecido e validado             | PASS / FAIL |           |
| Rollback não quebra compatibilidade com RPC 071            | PASS / FAIL |           |
| Banco não depende de código antigo para manter integridade | PASS / FAIL |           |

## 8. Validação Pós-Deploy

| Item                                        | Resultado   | Evidência |
| ------------------------------------------- | ----------- | --------- |
| Pagamento real de teste criado              | PASS / FAIL |           |
| Webhook processado corretamente             | PASS / FAIL |           |
| Reconciliação posterior confirmada          | PASS / FAIL |           |
| Logs da execução presentes em `domain_logs` | PASS / FAIL |           |
| Evento forçado aparece no Sentry            | PASS / FAIL |           |

## Gate Final

Liberar produção apenas se todas as condições abaixo estiverem em PASS:

- lock atômico validado sob concorrência
- nenhum pagamento preso com `finalizing = true`
- reconciliação estável por 3 ciclos consecutivos
- observabilidade ativa e confirmada
- rollback conhecido e utilizável

Resultado final desta validação: PASS / FAIL

Observações:

1. ***
2. ***
3. ***
