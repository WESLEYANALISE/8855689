-- Adicionar coluna url_audio na tabela advogado_blog
ALTER TABLE advogado_blog 
ADD COLUMN IF NOT EXISTS url_audio TEXT;