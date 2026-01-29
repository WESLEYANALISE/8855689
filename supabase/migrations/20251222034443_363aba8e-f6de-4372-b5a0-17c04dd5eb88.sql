-- Adicionar coluna para capa personalizada WebP
ALTER TABLE documentarios_juridicos 
ADD COLUMN IF NOT EXISTS capa_webp TEXT;