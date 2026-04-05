-- =====================================================
-- 052: Corrigir approve_affiliate_commission para usar commission_rate do afiliado
-- =====================================================
-- A função usava 30% fixo hardcoded, ignorando a comissaoExtra
-- de Diretores (+2% = 32%) e Sócios (+5% = 35%).
-- Agora busca o commission_rate da tabela affiliates.
-- =====================================================
CREATE OR REPLACE FUNCTION approve_affiliate_commission(
        p_tenant_id UUID,
        p_valor_assinatura DECIMAL,
        p_referencia_mes TEXT DEFAULT NULL
    ) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '' AS $$
DECLARE v_ref_mes TEXT;
v_updated INT := 0;
BEGIN v_ref_mes := COALESCE(p_referencia_mes, to_char(NOW(), 'YYYY-MM'));
-- Aprova comissão do vendedor usando commission_rate individual
UPDATE public.affiliate_referrals ar
SET status = 'aprovado',
    valor_assinatura = COALESCE(ar.valor_assinatura, p_valor_assinatura),
    comissao = COALESCE(
        ar.comissao,
        ROUND(
            p_valor_assinatura * COALESCE(
                (
                    SELECT a.commission_rate
                    FROM public.affiliates a
                    WHERE a.id = ar.affiliate_id
                ),
                0.30
            ),
            2
        )
    ),
    referencia_mes = COALESCE(ar.referencia_mes, v_ref_mes)
WHERE ar.tenant_id = p_tenant_id
    AND ar.status = 'pendente'
    AND (
        ar.referencia_mes IS NULL
        OR ar.referencia_mes = v_ref_mes
    );
GET DIAGNOSTICS v_updated = ROW_COUNT;
-- Aprova comissão do líder (se houver) — 10% fixo (sem variação por tier)
UPDATE public.affiliate_referrals
SET lider_status = 'aprovado',
    lider_comissao = COALESCE(
        lider_comissao,
        ROUND(p_valor_assinatura * 0.10, 2)
    )
WHERE tenant_id = p_tenant_id
    AND lider_id IS NOT NULL
    AND lider_status = 'pendente'
    AND (
        referencia_mes IS NULL
        OR referencia_mes = v_ref_mes
    );
RETURN jsonb_build_object(
    'ok',
    TRUE,
    'tenant_id',
    p_tenant_id,
    'referencia_mes',
    v_ref_mes,
    'rows_updated',
    v_updated
);
END;
$$;