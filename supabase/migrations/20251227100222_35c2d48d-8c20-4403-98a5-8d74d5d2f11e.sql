-- Adicionar coluna de foto de perfil na tabela evelyn_usuarios
ALTER TABLE evelyn_usuarios ADD COLUMN IF NOT EXISTS foto_perfil TEXT;