-- Criar tabela para armazenar transcrições segmentadas com timestamps
CREATE TABLE public.audiencias_transcricoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES public.audiencias_videos(id) ON DELETE CASCADE,
  segmentos JSONB NOT NULL DEFAULT '[]',
  idioma TEXT DEFAULT 'pt-BR',
  fonte TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para busca por video_id
CREATE INDEX idx_audiencias_transcricoes_video_id ON public.audiencias_transcricoes(video_id);

-- Enable RLS
ALTER TABLE public.audiencias_transcricoes ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública
CREATE POLICY "Transcrições são públicas para leitura"
ON public.audiencias_transcricoes
FOR SELECT
USING (true);

-- Política de inserção/atualização apenas via service role
CREATE POLICY "Service role pode inserir transcrições"
ON public.audiencias_transcricoes
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Service role pode atualizar transcrições"
ON public.audiencias_transcricoes
FOR UPDATE
USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_audiencias_transcricoes_updated_at
BEFORE UPDATE ON public.audiencias_transcricoes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();