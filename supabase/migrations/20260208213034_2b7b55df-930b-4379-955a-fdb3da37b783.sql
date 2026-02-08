-- Criar tabela para videoaulas das Áreas do Direito
CREATE TABLE public.videoaulas_areas_direito (
  id SERIAL PRIMARY KEY,
  video_id VARCHAR(20) NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  area VARCHAR(100) NOT NULL,
  playlist_id VARCHAR(50),
  thumb TEXT,
  duracao_segundos INTEGER,
  publicado_em TIMESTAMP WITH TIME ZONE,
  ordem INTEGER DEFAULT 0,
  
  -- Campos para conteúdo gerado por IA
  sobre_aula TEXT,
  flashcards JSONB,
  questoes JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Constraints
  CONSTRAINT unique_video_area UNIQUE (video_id, area)
);

-- Índices para performance
CREATE INDEX idx_videoaulas_areas_direito_area ON public.videoaulas_areas_direito(area);
CREATE INDEX idx_videoaulas_areas_direito_video_id ON public.videoaulas_areas_direito(video_id);
CREATE INDEX idx_videoaulas_areas_direito_playlist ON public.videoaulas_areas_direito(playlist_id);

-- Habilitar RLS
ALTER TABLE public.videoaulas_areas_direito ENABLE ROW LEVEL SECURITY;

-- Policy para leitura pública
CREATE POLICY "Videoaulas areas direito são públicas para leitura"
ON public.videoaulas_areas_direito
FOR SELECT
USING (true);

-- Policy para inserção (apenas via service role - edge functions)
CREATE POLICY "Inserção via service role"
ON public.videoaulas_areas_direito
FOR INSERT
WITH CHECK (true);

-- Policy para atualização (apenas via service role)
CREATE POLICY "Atualização via service role"
ON public.videoaulas_areas_direito
FOR UPDATE
USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_videoaulas_areas_direito_updated_at
BEFORE UPDATE ON public.videoaulas_areas_direito
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Comentários
COMMENT ON TABLE public.videoaulas_areas_direito IS 'Videoaulas das Áreas do Direito indexadas do YouTube';
COMMENT ON COLUMN public.videoaulas_areas_direito.video_id IS 'ID do vídeo no YouTube';
COMMENT ON COLUMN public.videoaulas_areas_direito.area IS 'Área do Direito (ex: Direito Constitucional)';
COMMENT ON COLUMN public.videoaulas_areas_direito.playlist_id IS 'ID da playlist de origem no YouTube';