-- =====================================================
-- Migration 040: Programa de Fidelidade
-- Configuração por restaurante, saldo e transações
-- =====================================================

-- Configuração do programa de fidelidade por restaurante
CREATE TABLE IF NOT EXISTS public.fidelidade_config (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurante_id  uuid NOT NULL UNIQUE REFERENCES public.restaurants(id) ON DELETE CASCADE,
  ativo           boolean DEFAULT true,
  -- Modelo de pontos: pontos ganhos por real gasto
  pontos_por_real numeric DEFAULT 1,
  -- Modelo de carimbo: compras necessárias para recompensa
  compras_para_recompensa integer DEFAULT 10,
  -- Recompensa: valor fixo em reais
  recompensa_valor numeric DEFAULT 0,
  -- Recompensa: percentual de desconto
  recompensa_percentual numeric DEFAULT 0,
  -- Validade dos pontos em dias (null = não expiram)
  validade_dias   integer,
  -- Descrição exibida ao cliente
  descricao       text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- Saldo de fidelidade do cliente por restaurante
CREATE TABLE IF NOT EXISTS public.fidelidade_cliente (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurante_id  uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  cliente_email   text NOT NULL,
  cliente_nome    text,
  pontos_saldo    integer DEFAULT 0,
  compras_total   integer DEFAULT 0,
  compras_ciclo   integer DEFAULT 0, -- compras no ciclo atual (zera ao resgatar)
  ultima_compra   timestamptz,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  UNIQUE(restaurante_id, cliente_email)
);

-- Histórico de transações de fidelidade
CREATE TABLE IF NOT EXISTS public.fidelidade_transacoes (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurante_id  uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  cliente_email   text NOT NULL,
  tipo            text NOT NULL CHECK (tipo IN ('acumulo', 'resgate', 'expiracao', 'ajuste')),
  pontos          integer NOT NULL, -- positivo = acumulo, negativo = resgate/expiracao
  compras         integer DEFAULT 0,
  pedido_id       uuid,
  descricao       text,
  created_at      timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_fidelidade_config_restaurante  ON public.fidelidade_config(restaurante_id);
CREATE INDEX IF NOT EXISTS idx_fidelidade_cliente_restaurante ON public.fidelidade_cliente(restaurante_id);
CREATE INDEX IF NOT EXISTS idx_fidelidade_cliente_email       ON public.fidelidade_cliente(cliente_email);
CREATE INDEX IF NOT EXISTS idx_fidelidade_transacoes_cliente  ON public.fidelidade_transacoes(restaurante_id, cliente_email);

-- Triggers updated_at
CREATE OR REPLACE FUNCTION public.fn_fidelidade_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fidelidade_config_updated_at ON public.fidelidade_config;
CREATE TRIGGER trg_fidelidade_config_updated_at
  BEFORE UPDATE ON public.fidelidade_config
  FOR EACH ROW EXECUTE FUNCTION public.fn_fidelidade_set_updated_at();

DROP TRIGGER IF EXISTS trg_fidelidade_cliente_updated_at ON public.fidelidade_cliente;
CREATE TRIGGER trg_fidelidade_cliente_updated_at
  BEFORE UPDATE ON public.fidelidade_cliente
  FOR EACH ROW EXECUTE FUNCTION public.fn_fidelidade_set_updated_at();

-- RLS — fidelidade_config
ALTER TABLE public.fidelidade_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fidelidade_config_operador_select" ON public.fidelidade_config
  FOR SELECT USING (
    restaurante_id IN (SELECT id FROM public.restaurants WHERE user_id = auth.uid())
  );

CREATE POLICY "fidelidade_config_operador_insert" ON public.fidelidade_config
  FOR INSERT WITH CHECK (
    restaurante_id IN (SELECT id FROM public.restaurants WHERE user_id = auth.uid())
  );

CREATE POLICY "fidelidade_config_operador_update" ON public.fidelidade_config
  FOR UPDATE USING (
    restaurante_id IN (SELECT id FROM public.restaurants WHERE user_id = auth.uid())
  );

-- Clientes leem a config do restaurante (para exibir programa)
CREATE POLICY "fidelidade_config_publica_select" ON public.fidelidade_config
  FOR SELECT USING (ativo = true);

-- RLS — fidelidade_cliente
ALTER TABLE public.fidelidade_cliente ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fidelidade_cliente_operador_select" ON public.fidelidade_cliente
  FOR SELECT USING (
    restaurante_id IN (SELECT id FROM public.restaurants WHERE user_id = auth.uid())
  );

CREATE POLICY "fidelidade_cliente_proprio_select" ON public.fidelidade_cliente
  FOR SELECT USING (cliente_email = auth.email());

CREATE POLICY "fidelidade_cliente_insert" ON public.fidelidade_cliente
  FOR INSERT WITH CHECK (true); -- API gerencia via service role

CREATE POLICY "fidelidade_cliente_update" ON public.fidelidade_cliente
  FOR UPDATE USING (true); -- API gerencia via service role

-- RLS — fidelidade_transacoes
ALTER TABLE public.fidelidade_transacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fidelidade_transacoes_operador_select" ON public.fidelidade_transacoes
  FOR SELECT USING (
    restaurante_id IN (SELECT id FROM public.restaurants WHERE user_id = auth.uid())
  );

CREATE POLICY "fidelidade_transacoes_cliente_select" ON public.fidelidade_transacoes
  FOR SELECT USING (cliente_email = auth.email());

CREATE POLICY "fidelidade_transacoes_insert" ON public.fidelidade_transacoes
  FOR INSERT WITH CHECK (true); -- API gerencia via service role
