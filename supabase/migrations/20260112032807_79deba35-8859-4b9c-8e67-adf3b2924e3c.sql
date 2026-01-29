-- Limpar URLs de áudio para regenerar com modelo gemini-2.5-flash-tts
UPDATE lei_seca_explicacoes 
SET url_audio = NULL, url_audio_descomplicado = NULL;