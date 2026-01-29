-- Tabela de assinaturas para Mercado Pago
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mp_preapproval_id TEXT UNIQUE,
  mp_payer_id TEXT,
  mp_payer_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'authorized', 'paused', 'cancelled', 'expired')),
  plan_type TEXT NOT NULL CHECK (plan_type IN ('mensal', 'anual')),
  amount DECIMAL(10,2) NOT NULL,
  next_payment_date TIMESTAMPTZ,
  last_payment_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_mp_preapproval_id ON public.subscriptions(mp_preapproval_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem ver suas próprias assinaturas"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias assinaturas"
  ON public.subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias assinaturas"
  ON public.subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Política para service role (webhooks)
CREATE POLICY "Service role pode gerenciar todas as assinaturas"
  ON public.subscriptions
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');