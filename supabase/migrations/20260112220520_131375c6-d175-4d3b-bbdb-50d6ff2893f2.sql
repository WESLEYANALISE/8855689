-- Limpar todas as capas da Lei Seca para regeneração com novos prompts
UPDATE lei_seca_explicacoes 
SET url_capa = NULL 
WHERE url_capa IS NOT NULL;