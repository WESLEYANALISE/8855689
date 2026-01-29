-- Adicionar colunas para áudios individuais
ALTER TABLE resumos_diarios 
ADD COLUMN IF NOT EXISTS url_audio_abertura TEXT,
ADD COLUMN IF NOT EXISTS url_audio_fechamento TEXT;