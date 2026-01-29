-- Adicionar coluna termos_json na tabela noticias_juridicas_cache
ALTER TABLE noticias_juridicas_cache 
ADD COLUMN IF NOT EXISTS termos_json JSONB DEFAULT '[]';

-- Adicionar coluna conteudo_formatado para texto limpo com parágrafos
ALTER TABLE noticias_juridicas_cache 
ADD COLUMN IF NOT EXISTS conteudo_formatado TEXT;