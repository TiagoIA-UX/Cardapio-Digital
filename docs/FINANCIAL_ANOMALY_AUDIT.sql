-- ======================================================
-- AUDITORIA DE ANOMALIAS FINANCEIRAS
-- ======================================================
-- Uso recomendado:
-- 1. Antes de teste de concorrência
-- 2. Depois de teste de concorrência
-- 3. Antes de deploy sensível
-- 4. Em rotina operacional diária
--
-- Interpretação padrão:
-- - Todas as consultas abaixo devem retornar 0 linhas
-- - Qualquer linha retornada exige investigação
-- ======================================================
-- 1) PAGAMENTOS PRESOS EM FINALIZAÇÃO
-- Esperado: 0 linhas
select dp.id as delivery_payment_id,
    dp.order_id,
    dp.status as payment_status,
    dp.metadata->>'finalizing' as finalizing,
    dp.updated_at,
    dp.created_at
from public.delivery_payments dp
where dp.metadata->>'finalizing' = 'true'
order by dp.updated_at desc;
-- 2) PAGAMENTO APROVADO COM PEDIDO INCONSISTENTE
-- Esperado: 0 linhas
select dp.id as delivery_payment_id,
    dp.order_id,
    dp.status as payment_status,
    o.status as order_status,
    dp.mp_payment_id,
    dp.paid_at,
    dp.updated_at
from public.delivery_payments dp
    join public.orders o on o.id = dp.order_id
where dp.status = 'approved'
    and o.status <> 'confirmed'
order by dp.updated_at desc;
-- 3) METADATA FINANCEIRA OBRIGATÓRIA AUSENTE
-- Esperado: 0 linhas
select dp.id as delivery_payment_id,
    dp.order_id,
    dp.status,
    dp.metadata
from public.delivery_payments dp
where dp.status = 'approved'
    and (
        dp.metadata->>'mp_status' is null
        or dp.metadata->>'finalize_source' is null
        or dp.metadata->>'finalize_last_run_at' is null
    )
order by dp.updated_at desc;
-- 4) PAGAMENTO PENDENTE, MAS METADATA JÁ INDICA MP APROVADO
-- Esperado: 0 linhas
select dp.id as delivery_payment_id,
    dp.order_id,
    dp.status as internal_status,
    dp.metadata->>'mp_status' as mp_status,
    dp.updated_at
from public.delivery_payments dp
where dp.status = 'pending'
    and dp.metadata->>'mp_status' = 'approved'
order by dp.updated_at desc;
-- 5) TIMESTAMPS INCONSISTENTES
-- Casos verificados:
-- - pagamento aprovado sem paid_at
-- - paid_at anterior ao created_at
-- - finalize_last_run_at anterior ao created_at
-- Esperado: 0 linhas
select dp.id as delivery_payment_id,
    dp.order_id,
    dp.status,
    dp.created_at,
    dp.paid_at,
    dp.metadata->>'finalize_last_run_at' as finalize_last_run_at,
    dp.updated_at
from public.delivery_payments dp
where (
        dp.status = 'approved'
        and dp.paid_at is null
    )
    or (
        dp.paid_at is not null
        and dp.paid_at < dp.created_at
    )
    or (
        dp.metadata->>'finalize_last_run_at' is not null
        and (dp.metadata->>'finalize_last_run_at')::timestamptz < dp.created_at
    )
order by dp.updated_at desc;
-- 6) DUPLICIDADE LÓGICA INESPERADA POR ORDER_ID
-- Esperado: 0 linhas
select dp.order_id,
    count(*) as total_registros,
    min(dp.created_at) as primeiro_registro,
    max(dp.created_at) as ultimo_registro
from public.delivery_payments dp
group by dp.order_id
having count(*) > 1
order by total_registros desc,
    ultimo_registro desc;
-- 7) PAGAMENTO APROVADO SEM MP_PAYMENT_ID
-- Esperado: 0 linhas
select dp.id as delivery_payment_id,
    dp.order_id,
    dp.status,
    dp.mp_payment_id,
    dp.metadata->>'mp_status' as mp_status,
    dp.updated_at
from public.delivery_payments dp
where dp.status = 'approved'
    and (
        dp.mp_payment_id is null
        or btrim(dp.mp_payment_id) = ''
    )
order by dp.updated_at desc;
-- 8) PEDIDO CONFIRMADO SEM PAGAMENTO APROVADO
-- Esperado: 0 linhas para pedidos pagos online por delivery
select dp.id as delivery_payment_id,
    dp.order_id,
    dp.status as payment_status,
    o.status as order_status,
    dp.updated_at
from public.delivery_payments dp
    join public.orders o on o.id = dp.order_id
where o.status = 'confirmed'
    and dp.status <> 'approved'
order by dp.updated_at desc;
-- 9) RESUMO CONSOLIDADO DE ANOMALIAS
-- Esperado: todos os totais = 0
with anomalies as (
    select 'locked_payment' as anomaly_type,
        dp.id::text as ref
    from public.delivery_payments dp
    where dp.metadata->>'finalizing' = 'true'
    union all
    select 'approved_payment_inconsistent_order',
        dp.id::text
    from public.delivery_payments dp
        join public.orders o on o.id = dp.order_id
    where dp.status = 'approved'
        and o.status <> 'confirmed'
    union all
    select 'missing_required_metadata',
        dp.id::text
    from public.delivery_payments dp
    where dp.status = 'approved'
        and (
            dp.metadata->>'mp_status' is null
            or dp.metadata->>'finalize_source' is null
            or dp.metadata->>'finalize_last_run_at' is null
        )
    union all
    select 'pending_but_mp_approved',
        dp.id::text
    from public.delivery_payments dp
    where dp.status = 'pending'
        and dp.metadata->>'mp_status' = 'approved'
    union all
    select 'timestamp_inconsistency',
        dp.id::text
    from public.delivery_payments dp
    where (
            dp.status = 'approved'
            and dp.paid_at is null
        )
        or (
            dp.paid_at is not null
            and dp.paid_at < dp.created_at
        )
        or (
            dp.metadata->>'finalize_last_run_at' is not null
            and (dp.metadata->>'finalize_last_run_at')::timestamptz < dp.created_at
        )
    union all
    select 'duplicate_order_payment',
        dp.order_id::text
    from public.delivery_payments dp
    group by dp.order_id
    having count(*) > 1
    union all
    select 'approved_without_mp_payment_id',
        dp.id::text
    from public.delivery_payments dp
    where dp.status = 'approved'
        and (
            dp.mp_payment_id is null
            or btrim(dp.mp_payment_id) = ''
        )
    union all
    select 'confirmed_order_without_approved_payment',
        dp.id::text
    from public.delivery_payments dp
        join public.orders o on o.id = dp.order_id
    where o.status = 'confirmed'
        and dp.status <> 'approved'
)
select anomaly_type,
    count(*) as total
from anomalies
group by anomaly_type
order by anomaly_type;
-- 10) OPCIONAL: VISÃO UNIFICADA PARA EVOLUÇÃO FUTURA
-- Se quiser transformar em view oficial, adaptar para migration e aplicar no schema.
-- Exemplo de direção:
-- create view public.financial_anomalies as
-- select 'locked_payment' as anomaly_type, dp.id as reference_id, dp.order_id, dp.updated_at as detected_at
-- from public.delivery_payments dp
-- where dp.metadata->>'finalizing' = 'true';