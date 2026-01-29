-- Limpar conteúdos descomplicados e áudios da Lei Seca para regeneração com prompts melhorados
UPDATE lei_seca_explicacoes 
SET 
  conteudo_descomplicado = NULL,
  url_audio = NULL,
  url_audio_descomplicado = NULL,
  cache_descomplicado = NULL
WHERE 
  conteudo_descomplicado IS NOT NULL 
  OR url_audio IS NOT NULL 
  OR url_audio_descomplicado IS NOT NULL;