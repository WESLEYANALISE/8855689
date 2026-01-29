-- Adicionar coluna para áudio do exemplo prático
ALTER TABLE public."FLASHCARDS_GERADOS" 
ADD COLUMN IF NOT EXISTS url_audio_exemplo TEXT;