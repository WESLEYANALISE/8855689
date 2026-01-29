-- Tabela para armazenar documentários jurídicos com transcrições
CREATE TABLE public.documentarios_juridicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id TEXT NOT NULL UNIQUE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  thumbnail TEXT,
  duracao TEXT,
  publicado_em TIMESTAMP WITH TIME ZONE,
  canal_nome TEXT,
  canal_id TEXT,
  transcricao JSONB DEFAULT '[]'::jsonb,
  transcricao_texto TEXT,
  visualizacoes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.documentarios_juridicos ENABLE ROW LEVEL SECURITY;

-- Policy para leitura pública
CREATE POLICY "Documentários são públicos para leitura"
  ON public.documentarios_juridicos
  FOR SELECT
  USING (true);

-- Índice para busca full-text na transcrição
CREATE INDEX idx_documentarios_transcricao_texto 
  ON public.documentarios_juridicos 
  USING GIN (to_tsvector('portuguese', COALESCE(transcricao_texto, '')));

-- Índice para busca por video_id
CREATE INDEX idx_documentarios_video_id 
  ON public.documentarios_juridicos (video_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_documentarios_juridicos_updated_at
  BEFORE UPDATE ON public.documentarios_juridicos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();