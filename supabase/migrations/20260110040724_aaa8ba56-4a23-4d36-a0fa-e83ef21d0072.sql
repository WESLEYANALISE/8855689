-- Tabela para tracking de cliques em planos
CREATE TABLE public.plan_click_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  plan_type TEXT NOT NULL,
  action TEXT NOT NULL,
  device TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_plan_click_analytics_user_id ON public.plan_click_analytics(user_id);
CREATE INDEX idx_plan_click_analytics_plan_type ON public.plan_click_analytics(plan_type);
CREATE INDEX idx_plan_click_analytics_action ON public.plan_click_analytics(action);
CREATE INDEX idx_plan_click_analytics_created_at ON public.plan_click_analytics(created_at DESC);

-- Enable RLS
ALTER TABLE public.plan_click_analytics ENABLE ROW LEVEL SECURITY;

-- Admin pode visualizar tudo
CREATE POLICY "Admin can view all plan analytics"
ON public.plan_click_analytics
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Qualquer usuário autenticado pode inserir
CREATE POLICY "Authenticated users can insert plan analytics"
ON public.plan_click_analytics
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Comentário na tabela
COMMENT ON TABLE public.plan_click_analytics IS 'Tracking de cliques e interações com planos de assinatura';