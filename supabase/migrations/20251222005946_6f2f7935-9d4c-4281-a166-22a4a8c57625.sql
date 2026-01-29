-- Habilitar extensão pgvector para busca semântica
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- TABELA: Marcadores personalizados do usuário
-- ============================================
CREATE TABLE public.audiencias_marcadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES audiencias_videos(id) ON DELETE CASCADE,
  timestamp_segundos INTEGER NOT NULL,
  titulo TEXT NOT NULL,
  nota TEXT,
  cor TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_marcadores_user ON audiencias_marcadores(user_id);
CREATE INDEX idx_marcadores_video ON audiencias_marcadores(video_id);
CREATE INDEX idx_marcadores_user_video ON audiencias_marcadores(user_id, video_id);

-- RLS: usuário só vê seus próprios marcadores
ALTER TABLE audiencias_marcadores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seus marcadores"
ON audiencias_marcadores FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus marcadores"
ON audiencias_marcadores FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus marcadores"
ON audiencias_marcadores FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus marcadores"
ON audiencias_marcadores FOR DELETE
USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_audiencias_marcadores_updated_at
BEFORE UPDATE ON audiencias_marcadores
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABELA: Embeddings dos segmentos de transcrição
-- ============================================
CREATE TABLE public.audiencias_segmentos_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transcricao_id UUID REFERENCES audiencias_transcricoes(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES audiencias_videos(id) ON DELETE CASCADE,
  indice_segmento INTEGER NOT NULL,
  texto TEXT NOT NULL,
  inicio_segundos INTEGER NOT NULL,
  fim_segundos INTEGER,
  embedding vector(768),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_seg_emb_video ON audiencias_segmentos_embeddings(video_id);
CREATE INDEX idx_seg_emb_transcricao ON audiencias_segmentos_embeddings(transcricao_id);

-- Índice vetorial IVFFlat para busca por similaridade
CREATE INDEX idx_seg_emb_vector ON audiencias_segmentos_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- RLS: leitura pública para embeddings
ALTER TABLE audiencias_segmentos_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Embeddings são públicos para leitura"
ON audiencias_segmentos_embeddings FOR SELECT
USING (true);

-- ============================================
-- FUNÇÃO: Buscar segmentos similares por embedding
-- ============================================
CREATE OR REPLACE FUNCTION buscar_segmentos_similares(
  query_embedding vector(768),
  limite int DEFAULT 10,
  similaridade_minima float DEFAULT 0.5
)
RETURNS TABLE (
  id uuid,
  video_id uuid,
  video_titulo text,
  tribunal text,
  thumbnail text,
  texto text,
  inicio_segundos int,
  fim_segundos int,
  similaridade float
) 
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
SELECT 
  s.id,
  s.video_id,
  v.titulo as video_titulo,
  c.tribunal,
  v.thumbnail,
  s.texto,
  s.inicio_segundos,
  s.fim_segundos,
  1 - (s.embedding <=> query_embedding) as similaridade
FROM audiencias_segmentos_embeddings s
JOIN audiencias_videos v ON v.id = s.video_id
LEFT JOIN canais_audiencias c ON c.id = v.canal_id
WHERE s.embedding IS NOT NULL
  AND 1 - (s.embedding <=> query_embedding) > similaridade_minima
ORDER BY s.embedding <=> query_embedding
LIMIT limite;
$$;