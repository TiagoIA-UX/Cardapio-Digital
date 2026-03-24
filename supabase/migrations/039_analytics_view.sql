-- =====================================================
-- Migration 039: Analytics do Operador
-- View e funções para dashboard de métricas
-- =====================================================

-- View de analytics agregada por restaurante
CREATE OR REPLACE VIEW public.vw_analytics_operador
WITH (security_invoker = false)
AS
SELECT
  o.restaurant_id,
  COUNT(o.id)                                                                    AS total_pedidos,
  COALESCE(SUM(o.total), 0)                                                      AS receita_total,
  COALESCE(AVG(o.total), 0)                                                      AS ticket_medio,
  COUNT(CASE WHEN o.created_at >= now() - interval '1 day'   THEN 1 END)        AS pedidos_hoje,
  COUNT(CASE WHEN o.created_at >= now() - interval '7 days'  THEN 1 END)        AS pedidos_semana,
  COUNT(CASE WHEN o.created_at >= now() - interval '30 days' THEN 1 END)        AS pedidos_mes,
  COALESCE(SUM(CASE WHEN o.created_at >= now() - interval '30 days' THEN o.total END), 0)
                                                                                 AS receita_mes
FROM public.orders o
GROUP BY o.restaurant_id;

-- Função para produtos mais vendidos
CREATE OR REPLACE FUNCTION public.fn_produtos_mais_vendidos(
  p_restaurante_id uuid,
  p_limite        integer DEFAULT 10
)
RETURNS TABLE(produto_nome text, quantidade bigint, receita numeric)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    oi.nome                                        AS produto_nome,
    SUM(oi.quantidade)                             AS quantidade,
    SUM(oi.quantidade * oi.preco_unitario)         AS receita
  FROM public.order_items oi
  JOIN public.orders      o  ON o.id = oi.order_id
  WHERE o.restaurant_id = p_restaurante_id
  GROUP BY oi.nome
  ORDER BY quantidade DESC
  LIMIT p_limite;
$$;

-- Função para distribuição de pedidos por hora (últimos 30 dias)
CREATE OR REPLACE FUNCTION public.fn_pedidos_por_hora(
  p_restaurante_id uuid
)
RETURNS TABLE(hora integer, total bigint)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    EXTRACT(HOUR FROM o.created_at)::integer AS hora,
    COUNT(*)                                 AS total
  FROM public.orders o
  WHERE o.restaurant_id = p_restaurante_id
    AND o.created_at >= now() - interval '30 days'
  GROUP BY hora
  ORDER BY hora;
$$;

-- Conceder acesso às funções para usuários autenticados
GRANT EXECUTE ON FUNCTION public.fn_produtos_mais_vendidos(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_pedidos_por_hora(uuid) TO authenticated;
