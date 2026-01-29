-- Tabela para rastrear acessos aos resumos
CREATE TABLE public.resumos_acessos (
  id BIGSERIAL PRIMARY KEY,
  resumo_id BIGINT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance nas consultas de "em alta"
CREATE INDEX idx_resumos_acessos_resumo_id ON public.resumos_acessos(resumo_id);
CREATE INDEX idx_resumos_acessos_created_at ON public.resumos_acessos(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.resumos_acessos ENABLE ROW LEVEL SECURITY;

-- Permitir inserção anônima (qualquer usuário pode registrar acesso)
CREATE POLICY "Permitir inserção de acessos" ON public.resumos_acessos
  FOR INSERT WITH CHECK (true);

-- Permitir leitura pública para calcular "em alta"
CREATE POLICY "Permitir leitura pública de acessos" ON public.resumos_acessos
  FOR SELECT USING (true);