-- Adicionar coluna de áudios à tabela aulas_artigos para armazenar URLs de narração por slide
ALTER TABLE public.aulas_artigos 
ADD COLUMN IF NOT EXISTS audios JSONB DEFAULT '{}'::jsonb;

-- Criar tabela para controle de fila de geração automática de aulas
CREATE TABLE IF NOT EXISTS public.fila_geracao_aulas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo_tabela TEXT NOT NULL,
  ultimo_artigo_processado INTEGER DEFAULT 0,
  em_processamento BOOLEAN DEFAULT false,
  ultima_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(codigo_tabela)
);

-- Habilitar RLS
ALTER TABLE public.fila_geracao_aulas ENABLE ROW LEVEL SECURITY;

-- Política para leitura pública (necessário para edge functions)
CREATE POLICY "Permitir leitura pública da fila" 
ON public.fila_geracao_aulas 
FOR SELECT 
USING (true);

-- Política para inserção/atualização via service role (edge functions)
CREATE POLICY "Permitir inserção pública da fila" 
ON public.fila_geracao_aulas 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Permitir atualização pública da fila" 
ON public.fila_geracao_aulas 
FOR UPDATE 
USING (true);

-- Índice para busca por código
CREATE INDEX IF NOT EXISTS idx_fila_geracao_codigo ON public.fila_geracao_aulas(codigo_tabela);

-- Comentário na coluna
COMMENT ON COLUMN public.aulas_artigos.audios IS 'JSON com URLs de áudio por slide: {"secaoId-slideIndex": "url_audio"}';