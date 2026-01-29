-- Limpar URLs de áudio antigos (formato PCM incorreto) para forçar regeneração em WAV
UPDATE lei_seca_explicacoes 
SET url_audio = NULL, url_audio_descomplicado = NULL 
WHERE url_audio IS NOT NULL OR url_audio_descomplicado IS NOT NULL;