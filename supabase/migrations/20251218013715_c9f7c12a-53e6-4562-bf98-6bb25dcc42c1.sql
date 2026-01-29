-- Adicionar colunas para armazenar conteúdo pré-processado
ALTER TABLE noticias_politicas_cache 
ADD COLUMN IF NOT EXISTS conteudo_formatado TEXT,
ADD COLUMN IF NOT EXISTS resumo_facil TEXT,
ADD COLUMN IF NOT EXISTS termos JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS processado BOOLEAN DEFAULT false;

-- Índice para filtrar apenas notícias processadas
CREATE INDEX IF NOT EXISTS idx_noticias_politicas_processado ON noticias_politicas_cache(processado) WHERE processado = true;