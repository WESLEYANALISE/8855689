-- Criar tabela para armazenar vídeos do Resumo do Dia
CREATE TABLE IF NOT EXISTS videos_resumo_dia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL,
  area TEXT NOT NULL CHECK (area IN ('direito', 'politica', 'concurso')),
  url_video TEXT NOT NULL,
  duracao_segundos INTEGER,
  tamanho_bytes BIGINT,
  thumbnail_url TEXT,
  noticias_resumidas INTEGER DEFAULT 0,
  status TEXT DEFAULT 'gerado' CHECK (status IN ('gerando', 'gerado', 'erro')),
  erro_mensagem TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(data, area)
);

-- Índice para busca rápida por data e área
CREATE INDEX IF NOT EXISTS idx_videos_resumo_data_area ON videos_resumo_dia(data, area);

-- Adicionar colunas de preferência de vídeo na tabela de notificações
ALTER TABLE evelyn_preferencias_notificacao
ADD COLUMN IF NOT EXISTS receber_video_resumo BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS areas_video TEXT[] DEFAULT ARRAY['direito']::TEXT[];

-- Criar bucket para vídeos se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS para leitura pública dos vídeos
CREATE POLICY "Videos publicos leitura" ON storage.objects
FOR SELECT USING (bucket_id = 'videos');

-- RLS para upload via service role
CREATE POLICY "Upload videos via service" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'videos');