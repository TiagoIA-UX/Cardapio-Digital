-- =====================================================
-- 084: Guard rail de idempotência por tenant + mês + plano
--
-- Objetivo:
-- - preservar a regra padrão de uma comissão por tenant/mês
-- - permitir exceção legítima de mudança de plano no mesmo mês
-- - substituir a trava 074 por granularidade explícita via coluna plano
-- =====================================================
-- Backfill defensivo para linhas antigas sem referência de mês.
UPDATE public.affiliate_referrals
SET referencia_mes = to_char(created_at, 'YYYY-MM')
WHERE tenant_id IS NOT NULL
    AND referencia_mes IS NULL;

-- Backfill defensivo para linhas antigas sem plano explícito.
UPDATE public.affiliate_referrals
SET plano = 'unknown_plan'
WHERE tenant_id IS NOT NULL
    AND (plano IS NULL OR btrim(plano) = '');

-- Remove a trava antiga para recriar com granularidade por plano.
DROP INDEX IF EXISTS public.uniq_affiliate_referrals_tenant_month;

-- Nova trava estrutural: uma comissão por tenant, mês e plano.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_affiliate_referrals_tenant_month_plan
    ON public.affiliate_referrals (tenant_id, referencia_mes, plano)
    WHERE tenant_id IS NOT NULL;

COMMENT ON INDEX public.uniq_affiliate_referrals_tenant_month_plan IS 'Guarda de idempotência para impedir duplicação de comissão por tenant, mês e plano.';