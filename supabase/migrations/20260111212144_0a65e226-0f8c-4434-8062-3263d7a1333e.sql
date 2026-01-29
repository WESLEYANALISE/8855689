-- Tabela para armazenar videoaulas para iniciantes
CREATE TABLE public.videoaulas_iniciante (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id TEXT NOT NULL UNIQUE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  thumbnail TEXT,
  duracao_segundos INTEGER,
  ordem INTEGER NOT NULL,
  playlist_id TEXT,
  publicado_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.videoaulas_iniciante ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública
CREATE POLICY "Videoaulas são públicas para leitura"
ON public.videoaulas_iniciante
FOR SELECT
USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_videoaulas_iniciante_updated_at
BEFORE UPDATE ON public.videoaulas_iniciante
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índice para ordenação
CREATE INDEX idx_videoaulas_iniciante_ordem ON public.videoaulas_iniciante(ordem);