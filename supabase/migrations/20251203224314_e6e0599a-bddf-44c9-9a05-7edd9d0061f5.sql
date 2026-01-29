-- Adicionar colunas para armazenar URLs de áudio na tabela RESUMO
ALTER TABLE "RESUMO" 
ADD COLUMN IF NOT EXISTS url_audio_resumo text,
ADD COLUMN IF NOT EXISTS url_audio_exemplos text,
ADD COLUMN IF NOT EXISTS url_audio_termos text;