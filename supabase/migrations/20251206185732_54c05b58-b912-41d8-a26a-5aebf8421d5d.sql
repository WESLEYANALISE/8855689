-- Adicionar colunas para armazenar URLs de áudio nos flashcards
ALTER TABLE public."FLASHCARDS_GERADOS" 
ADD COLUMN IF NOT EXISTS url_audio_pergunta TEXT,
ADD COLUMN IF NOT EXISTS url_audio_resposta TEXT;