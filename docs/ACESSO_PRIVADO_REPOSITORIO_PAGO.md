# Fluxo de Acesso Privado ao Repositório Pago

## Objetivo

- Liberar acesso ao código-fonte somente para clientes pagantes, com rastreabilidade e escopo mínimo.

## Modelo recomendado

- Repositório principal privado.
- Concessão individual por usuário GitHub, nunca por link aberto.
- Permissão mínima: pull.
- Licença comercial vinculada ao pagamento confirmado.
- Revogação imediata em caso de chargeback, inadimplência ou violação contratual.

## Operação padrão

1. Confirmar pagamento compensado e plano vendido.
2. Coletar usuário GitHub do cliente.
3. Registrar aceite da licença comercial.
4. Rodar o script de dry-run para validar os dados.
5. Registrar o grant no ledger administrativo.
6. Rodar o script com apply para enviar o convite real.
7. Confirmar data, operador e template liberado.

## Ledger administrativo

- Migration: supabase/migrations/045_private_repo_access_grants.sql
- Rota admin protegida: /api/admin/repo-access
- Finalidade: listar grants, registrar concessão, registrar revogação e manter trilha administrativa.

Payloads suportados na rota:

- action=grant para registrar uma concessão comercial.
- action=revoke para registrar uma revogação com motivo.

## Script operacional

Dry-run:

```bash
npm run access:grant -- --github cliente-pago --customer "Cliente Pago" --email cliente@example.com --template pizzaria --plan pro --price 99700 --granted-by tiago
```

Aplicação real:

```bash
npm run access:grant -- --github cliente-pago --customer "Cliente Pago" --email cliente@example.com --template pizzaria --plan pro --price 99700 --granted-by tiago --apply
```

## Regras de segurança

- Não conceder acesso write para clientes pagantes comuns.
- Não conceder acesso a times ou organizações sem contrato específico.
- Não usar repositório público para distribuir templates pagos.
- Não confiar em NDA sem controle técnico de acesso.

## Revogação

- Ao encerrar contrato ou detectar abuso, usar o comando de revoke gerado pelo script.
- Registrar motivo da revogação e data.
