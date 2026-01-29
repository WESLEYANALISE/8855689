
-- Limpar links do Catbox da tabela BLOGGER_JURIDICO
UPDATE "BLOGGER_JURIDICO" 
SET url_capa = NULL 
WHERE url_capa LIKE '%catbox%' OR url_capa LIKE '%litterbox%';

UPDATE "BLOGGER_JURIDICO" 
SET url_audio = NULL 
WHERE url_audio LIKE '%catbox%' OR url_audio LIKE '%litterbox%';

-- Limpar links do Catbox da tabela QUESTOES_GERADAS
UPDATE "QUESTOES_GERADAS" 
SET url_imagem_exemplo = NULL 
WHERE url_imagem_exemplo LIKE '%catbox%' OR url_imagem_exemplo LIKE '%litterbox%';

UPDATE "QUESTOES_GERADAS" 
SET url_audio = NULL 
WHERE url_audio LIKE '%catbox%' OR url_audio LIKE '%litterbox%';

UPDATE "QUESTOES_GERADAS" 
SET url_audio_comentario = NULL 
WHERE url_audio_comentario LIKE '%catbox%' OR url_audio_comentario LIKE '%litterbox%';

UPDATE "QUESTOES_GERADAS" 
SET url_audio_exemplo = NULL 
WHERE url_audio_exemplo LIKE '%catbox%' OR url_audio_exemplo LIKE '%litterbox%';

-- Limpar links do Catbox da tabela RESUMO
UPDATE "RESUMO" 
SET url_imagem_exemplo_1 = NULL 
WHERE url_imagem_exemplo_1 LIKE '%catbox%' OR url_imagem_exemplo_1 LIKE '%litterbox%';

UPDATE "RESUMO" 
SET url_imagem_exemplo_2 = NULL 
WHERE url_imagem_exemplo_2 LIKE '%catbox%' OR url_imagem_exemplo_2 LIKE '%litterbox%';

UPDATE "RESUMO" 
SET url_imagem_exemplo_3 = NULL 
WHERE url_imagem_exemplo_3 LIKE '%catbox%' OR url_imagem_exemplo_3 LIKE '%litterbox%';

UPDATE "RESUMO" 
SET url_imagem_resumo = NULL 
WHERE url_imagem_resumo LIKE '%catbox%' OR url_imagem_resumo LIKE '%litterbox%';

UPDATE "RESUMO" 
SET url_audio_exemplos = NULL 
WHERE url_audio_exemplos LIKE '%catbox%' OR url_audio_exemplos LIKE '%litterbox%';

UPDATE "RESUMO" 
SET url_audio_resumo = NULL 
WHERE url_audio_resumo LIKE '%catbox%' OR url_audio_resumo LIKE '%litterbox%';

UPDATE "RESUMO" 
SET url_audio_termos = NULL 
WHERE url_audio_termos LIKE '%catbox%' OR url_audio_termos LIKE '%litterbox%';
