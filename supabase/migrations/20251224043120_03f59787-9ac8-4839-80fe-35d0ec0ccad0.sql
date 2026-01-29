-- Adicionar colunas para dimensões e preset na tabela de cache
ALTER TABLE cache_imagens_webp 
ADD COLUMN IF NOT EXISTS largura INTEGER,
ADD COLUMN IF NOT EXISTS altura INTEGER,
ADD COLUMN IF NOT EXISTS preset TEXT;

-- Criar índice para busca rápida por url + preset
CREATE INDEX IF NOT EXISTS idx_cache_imagens_preset ON cache_imagens_webp(url_original, preset);

-- Criar índice para busca por preset
CREATE INDEX IF NOT EXISTS idx_cache_imagens_by_preset ON cache_imagens_webp(preset);