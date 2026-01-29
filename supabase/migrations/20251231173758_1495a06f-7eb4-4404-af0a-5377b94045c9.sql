-- Tabela para estatísticas de questões por usuário
CREATE TABLE public.user_questoes_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  area TEXT NOT NULL,
  tema TEXT,
  acertos INTEGER DEFAULT 0,
  erros INTEGER DEFAULT 0,
  ultima_resposta TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, area, tema)
);

-- Índices para performance
CREATE INDEX idx_user_questoes_stats_user_id ON public.user_questoes_stats(user_id);
CREATE INDEX idx_user_questoes_stats_area ON public.user_questoes_stats(area);

-- Habilitar RLS
ALTER TABLE public.user_questoes_stats ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Users can view own stats"
  ON public.user_questoes_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stats"
  ON public.user_questoes_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stats"
  ON public.user_questoes_stats FOR UPDATE
  USING (auth.uid() = user_id);

-- Função RPC para registrar resposta do usuário
CREATE OR REPLACE FUNCTION public.registrar_resposta_usuario(
  p_area TEXT,
  p_tema TEXT,
  p_correta BOOLEAN
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.user_questoes_stats (user_id, area, tema, acertos, erros)
  VALUES (
    auth.uid(),
    p_area,
    COALESCE(p_tema, 'Geral'),
    CASE WHEN p_correta THEN 1 ELSE 0 END,
    CASE WHEN p_correta THEN 0 ELSE 1 END
  )
  ON CONFLICT (user_id, area, tema)
  DO UPDATE SET
    acertos = user_questoes_stats.acertos + CASE WHEN p_correta THEN 1 ELSE 0 END,
    erros = user_questoes_stats.erros + CASE WHEN p_correta THEN 0 ELSE 1 END,
    ultima_resposta = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;