-- Adicionar coluna imagem_webp na tabela noticias_concursos_cache
ALTER TABLE noticias_concursos_cache 
ADD COLUMN IF NOT EXISTS imagem_webp TEXT;