-- Criar tabela de visualizações de artigos do vade mecum
CREATE TABLE IF NOT EXISTS public.artigos_visualizacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tabela_codigo TEXT NOT NULL,
  numero_artigo TEXT NOT NULL,
  user_id UUID,
  visualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  origem TEXT DEFAULT 'busca'
);

-- Habilitar RLS
ALTER TABLE public.artigos_visualizacoes ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Todos podem visualizar estatísticas"
ON public.artigos_visualizacoes
FOR SELECT
USING (true);

CREATE POLICY "Sistema pode registrar visualizações"
ON public.artigos_visualizacoes
FOR INSERT
WITH CHECK (true);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_artigos_visualizacoes_tabela ON public.artigos_visualizacoes(tabela_codigo);
CREATE INDEX IF NOT EXISTS idx_artigos_visualizacoes_numero ON public.artigos_visualizacoes(numero_artigo);
CREATE INDEX IF NOT EXISTS idx_artigos_visualizacoes_tabela_numero ON public.artigos_visualizacoes(tabela_codigo, numero_artigo);
CREATE INDEX IF NOT EXISTS idx_artigos_visualizacoes_data ON public.artigos_visualizacoes(visualizado_em DESC);