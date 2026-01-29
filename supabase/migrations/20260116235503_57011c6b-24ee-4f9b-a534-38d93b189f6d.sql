-- Adicionar coluna capa_url para armazenar capas geradas dos tópicos
ALTER TABLE faculdade_topicos ADD COLUMN IF NOT EXISTS capa_url TEXT;