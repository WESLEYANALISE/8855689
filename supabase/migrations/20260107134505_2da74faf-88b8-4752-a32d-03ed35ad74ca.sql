-- Adicionar colunas para suportar posts importados do Instagram
ALTER TABLE posts_juridicos ADD COLUMN IF NOT EXISTS fonte TEXT DEFAULT 'interno';
ALTER TABLE posts_juridicos ADD COLUMN IF NOT EXISTS fonte_url TEXT;
ALTER TABLE posts_juridicos ADD COLUMN IF NOT EXISTS fonte_perfil TEXT;
ALTER TABLE posts_juridicos ADD COLUMN IF NOT EXISTS instagram_id TEXT;
ALTER TABLE posts_juridicos ADD COLUMN IF NOT EXISTS tipo_midia TEXT DEFAULT 'carrossel';
ALTER TABLE posts_juridicos ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE posts_juridicos ADD COLUMN IF NOT EXISTS legenda TEXT;
ALTER TABLE posts_juridicos ADD COLUMN IF NOT EXISTS likes_original INTEGER;
ALTER TABLE posts_juridicos ADD COLUMN IF NOT EXISTS comentarios_original INTEGER;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_posts_juridicos_instagram_id ON posts_juridicos(instagram_id);
CREATE INDEX IF NOT EXISTS idx_posts_juridicos_fonte ON posts_juridicos(fonte);

-- Constraint única para evitar duplicatas
ALTER TABLE posts_juridicos ADD CONSTRAINT posts_juridicos_instagram_id_unique UNIQUE (instagram_id);