-- Migration: 039_analytics_operador.sql
-- View de analytics para o painel do operador
-- SECURITY DEFINER + SET search_path garante execução segura

CREATE OR REPLACE VIEW vw_analytics_operador
WITH (security_barrier = TRUE)
AS
SELECT
  o.restaurant_id,

  -- ── Contagens por período ────────────────────────────────────────────────
  COUNT(*) FILTER (
    WHERE o.created_at >= date_trunc('day', NOW() AT TIME ZONE 'America/Sao_Paulo')
  )                                                                 AS pedidos_hoje,

  COUNT(*) FILTER (
    WHERE o.created_at >= date_trunc('week', NOW() AT TIME ZONE 'America/Sao_Paulo')
  )                                                                 AS pedidos_semana,

  COUNT(*) FILTER (
    WHERE o.created_at >= date_trunc('month', NOW() AT TIME ZONE 'America/Sao_Paulo')
  )                                                                 AS pedidos_mes,

  -- ── Receita por período ──────────────────────────────────────────────────
  COALESCE(SUM(o.total) FILTER (
    WHERE o.created_at >= date_trunc('day', NOW() AT TIME ZONE 'America/Sao_Paulo')
  ), 0)                                                             AS receita_hoje,

  COALESCE(SUM(o.total) FILTER (
    WHERE o.created_at >= date_trunc('week', NOW() AT TIME ZONE 'America/Sao_Paulo')
  ), 0)                                                             AS receita_semana,

  COALESCE(SUM(o.total) FILTER (
    WHERE o.created_at >= date_trunc('month', NOW() AT TIME ZONE 'America/Sao_Paulo')
  ), 0)                                                             AS receita_mes,

  -- ── Ticket médio (mês) ───────────────────────────────────────────────────
  CASE
    WHEN COUNT(*) FILTER (
      WHERE o.created_at >= date_trunc('month', NOW() AT TIME ZONE 'America/Sao_Paulo')
    ) > 0
    THEN ROUND(
      COALESCE(SUM(o.total) FILTER (
        WHERE o.created_at >= date_trunc('month', NOW() AT TIME ZONE 'America/Sao_Paulo')
      ), 0)
      /
      COUNT(*) FILTER (
        WHERE o.created_at >= date_trunc('month', NOW() AT TIME ZONE 'America/Sao_Paulo')
      ),
      2
    )
    ELSE 0
  END                                                               AS ticket_medio_mes

FROM orders o
WHERE o.status NOT IN ('cancelled')
GROUP BY o.restaurant_id;

-- Segurança: apenas o dono do restaurante enxerga seus dados
-- (filtro aplicado na query da página via .eq('restaurant_id', id))

-- ─── Produtos mais vendidos (função auxiliar) ─────────────────────────────────

CREATE OR REPLACE FUNCTION get_top_produtos(
  p_restaurant_id UUID,
  p_limit         INTEGER DEFAULT 10
)
RETURNS TABLE (
  produto_id   UUID,
  nome         TEXT,
  quantidade   BIGINT,
  receita      NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    oi.product_id   AS produto_id,
    p.nome          AS nome,
    SUM(oi.quantity)::BIGINT  AS quantidade,
    SUM(oi.price * oi.quantity) AS receita
  FROM order_items oi
  JOIN orders     o  ON o.id  = oi.order_id
  JOIN products   p  ON p.id  = oi.product_id
  WHERE o.restaurant_id = p_restaurant_id
    AND o.status NOT IN ('cancelled')
    AND o.created_at >= date_trunc('month', NOW() AT TIME ZONE 'America/Sao_Paulo')
  GROUP BY oi.product_id, p.nome
  ORDER BY quantidade DESC
  LIMIT p_limit;
$$;

-- ─── Distribuição por hora (pico de pedidos) ─────────────────────────────────

CREATE OR REPLACE FUNCTION get_horarios_pico(
  p_restaurant_id UUID
)
RETURNS TABLE (
  hora     INTEGER,
  pedidos  BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    EXTRACT(HOUR FROM o.created_at AT TIME ZONE 'America/Sao_Paulo')::INTEGER AS hora,
    COUNT(*)::BIGINT AS pedidos
  FROM orders o
  WHERE o.restaurant_id = p_restaurant_id
    AND o.status NOT IN ('cancelled')
    AND o.created_at >= date_trunc('month', NOW() AT TIME ZONE 'America/Sao_Paulo')
  GROUP BY hora
  ORDER BY hora;
$$;
