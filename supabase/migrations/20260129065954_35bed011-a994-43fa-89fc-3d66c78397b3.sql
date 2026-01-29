-- Tabela para armazenar videoaulas da 1ª Fase OAB
CREATE TABLE public.videoaulas_oab_primeira_fase (
  id SERIAL PRIMARY KEY,
  video_id TEXT NOT NULL UNIQUE,
  playlist_id TEXT NOT NULL,
  area TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  thumbnail TEXT,
  duracao TEXT,
  ordem INTEGER DEFAULT 0,
  transcricao TEXT,
  sobre_aula TEXT,
  flashcards JSONB,
  questoes JSONB,
  publicado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_videoaulas_oab_1fase_area ON public.videoaulas_oab_primeira_fase(area);
CREATE INDEX idx_videoaulas_oab_1fase_playlist ON public.videoaulas_oab_primeira_fase(playlist_id);
CREATE INDEX idx_videoaulas_oab_1fase_ordem ON public.videoaulas_oab_primeira_fase(ordem);

-- Enable RLS
ALTER TABLE public.videoaulas_oab_primeira_fase ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública
CREATE POLICY "Videoaulas OAB 1ª Fase são públicas para leitura"
ON public.videoaulas_oab_primeira_fase
FOR SELECT
USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_videoaulas_oab_primeira_fase_updated_at
  BEFORE UPDATE ON public.videoaulas_oab_primeira_fase
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();