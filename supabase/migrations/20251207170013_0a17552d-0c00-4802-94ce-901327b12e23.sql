-- Limpar URLs de áudio de comentário e exemplo para regenerar com voz feminina
UPDATE "QUESTOES_GERADAS" 
SET url_audio_comentario = NULL, url_audio_exemplo = NULL;

-- Limpar cache de feedback de áudio para regenerar com novas mensagens e voz feminina
DELETE FROM "AUDIO_FEEDBACK_CACHE";