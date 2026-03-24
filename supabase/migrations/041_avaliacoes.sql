-- =====================================================
-- Migration 041: Sistema de Avaliações / Reviews
-- Clientes avaliam restaurantes com nota 1-5
-- =====================================================

CREATE TABLE IF NOT EXISTS public.avaliacoes (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurante_id  uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  pedido_id       uuid,
  cliente_nome    text NOT NULL,
  cliente_email   text,
  nota            integer NOT NULL CHECK (nota BETWEEN 1 AND 5),
  comentario      text,
  resposta        text,         -- resposta do operador
  respondido_em   timestamptz,
  ativo           boolean DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_avaliacoes_restaurante_id ON public.avaliacoes(restaurante_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_nota           ON public.avaliacoes(nota);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_ativo          ON public.avaliacoes(ativo);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.fn_avaliacoes_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_avaliacoes_updated_at ON public.avaliacoes;
CREATE TRIGGER trg_avaliacoes_updated_at
  BEFORE UPDATE ON public.avaliacoes
  FOR EACH ROW EXECUTE FUNCTION public.fn_avaliacoes_set_updated_at();

-- View pública de média de avaliações por restaurante
CREATE OR REPLACE VIEW public.vw_avaliacoes_resumo
WITH (security_invoker = false)
AS
SELECT
  restaurante_id,
  COUNT(id)        AS total_avaliacoes,
  ROUND(AVG(nota)::numeric, 1) AS nota_media,
  COUNT(CASE WHEN nota = 5 THEN 1 END) AS notas_5,
  COUNT(CASE WHEN nota = 4 THEN 1 END) AS notas_4,
  COUNT(CASE WHEN nota = 3 THEN 1 END) AS notas_3,
  COUNT(CASE WHEN nota = 2 THEN 1 END) AS notas_2,
  COUNT(CASE WHEN nota = 1 THEN 1 END) AS notas_1
FROM public.avaliacoes
WHERE ativo = true
GROUP BY restaurante_id;

-- RLS
ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;

-- Qualquer um lê avaliações ativas (público)
CREATE POLICY "avaliacoes_publica_select" ON public.avaliacoes
  FOR SELECT USING (ativo = true);

-- Qualquer um (cliente anônimo ou autenticado) cria avaliação
CREATE POLICY "avaliacoes_cliente_insert" ON public.avaliacoes
  FOR INSERT WITH CHECK (true);

-- Operador pode atualizar avaliações do próprio restaurante (responder)
CREATE POLICY "avaliacoes_operador_update" ON public.avaliacoes
  FOR UPDATE USING (
    restaurante_id IN (SELECT id FROM public.restaurants WHERE user_id = auth.uid())
  );

-- Operador pode desativar avaliações do próprio restaurante
CREATE POLICY "avaliacoes_operador_delete" ON public.avaliacoes
  FOR DELETE USING (
    restaurante_id IN (SELECT id FROM public.restaurants WHERE user_id = auth.uid())
  );

-- Admin vê tudo
CREATE POLICY "avaliacoes_admin_select" ON public.avaliacoes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
  );
