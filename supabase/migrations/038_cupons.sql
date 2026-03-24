-- =====================================================
-- Migration 038: Sistema de Cupons do Operador
-- Tabela `cupons` com RLS por restaurante
-- =====================================================

-- Tabela de cupons
CREATE TABLE IF NOT EXISTS public.cupons (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurante_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  codigo text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('percentual', 'valor_fixo')),
  valor numeric NOT NULL CHECK (valor > 0),
  valor_minimo_pedido numeric DEFAULT 0,
  max_usos integer, -- null = ilimitado
  usos_atuais integer DEFAULT 0,
  ativo boolean DEFAULT true,
  data_inicio timestamptz DEFAULT now(),
  data_expiracao timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(restaurante_id, codigo)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_cupons_restaurante_id ON public.cupons(restaurante_id);
CREATE INDEX IF NOT EXISTS idx_cupons_codigo ON public.cupons(codigo);
CREATE INDEX IF NOT EXISTS idx_cupons_ativo ON public.cupons(ativo);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.fn_cupons_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cupons_updated_at ON public.cupons;
CREATE TRIGGER trg_cupons_updated_at
  BEFORE UPDATE ON public.cupons
  FOR EACH ROW EXECUTE FUNCTION public.fn_cupons_set_updated_at();

-- RLS
ALTER TABLE public.cupons ENABLE ROW LEVEL SECURITY;

-- Operador vê e gerencia os próprios cupons
CREATE POLICY "cupons_operador_select" ON public.cupons
  FOR SELECT USING (
    restaurante_id IN (
      SELECT id FROM public.restaurants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "cupons_operador_insert" ON public.cupons
  FOR INSERT WITH CHECK (
    restaurante_id IN (
      SELECT id FROM public.restaurants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "cupons_operador_update" ON public.cupons
  FOR UPDATE USING (
    restaurante_id IN (
      SELECT id FROM public.restaurants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "cupons_operador_delete" ON public.cupons
  FOR DELETE USING (
    restaurante_id IN (
      SELECT id FROM public.restaurants WHERE user_id = auth.uid()
    )
  );

-- Admin vê todos os cupons
CREATE POLICY "cupons_admin_select" ON public.cupons
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
  );

-- Cliente pode validar cupom ativo (apenas leitura pública)
CREATE POLICY "cupons_cliente_valida" ON public.cupons
  FOR SELECT USING (
    ativo = true
    AND (data_expiracao IS NULL OR data_expiracao > now())
    AND (data_inicio IS NULL OR data_inicio <= now())
  );
