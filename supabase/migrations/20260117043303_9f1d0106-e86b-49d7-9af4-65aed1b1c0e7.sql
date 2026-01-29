-- Limpar todas as narrações antigas dos tópicos da faculdade
UPDATE faculdade_topicos 
SET url_narracao = NULL 
WHERE url_narracao IS NOT NULL;