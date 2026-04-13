-- =====================================================
-- MIGRATION 068 -- Normalizacao de cupons GANHEI*
-- Corrige case-sensitive e garante cupons de teste ativos
-- =====================================================
-- Remove variantes com caixa diferente para evitar conflito por codigo canonico
DELETE FROM coupons
WHERE UPPER(code) = 'GANHEI99%'
    AND code <> 'GANHEI99%';
DELETE FROM coupons
WHERE UPPER(code) = 'GANHEI30%'
    AND code <> 'GANHEI30%';
DELETE FROM coupons
WHERE UPPER(code) = 'GANHEI7%'
    AND code <> 'GANHEI7%';
-- Padrao solicitado para testes e operacao assistida
INSERT INTO coupons (
        code,
        discount_type,
        discount_value,
        min_purchase,
        max_uses,
        current_uses,
        expires_at,
        is_active
    )
VALUES (
        'GANHEI99%',
        'percentage',
        99.00,
        0,
        NULL,
        0,
        NOW() + INTERVAL '1 year',
        true
    ),
    (
        'GANHEI30%',
        'percentage',
        30.00,
        0,
        NULL,
        0,
        NOW() + INTERVAL '1 year',
        true
    ),
    (
        'GANHEI7%',
        'percentage',
        7.00,
        0,
        NULL,
        0,
        NOW() + INTERVAL '1 year',
        true
    ) ON CONFLICT (code) DO
UPDATE
SET discount_type = EXCLUDED.discount_type,
    discount_value = EXCLUDED.discount_value,
    min_purchase = EXCLUDED.min_purchase,
    max_uses = EXCLUDED.max_uses,
    expires_at = EXCLUDED.expires_at,
    is_active = EXCLUDED.is_active;