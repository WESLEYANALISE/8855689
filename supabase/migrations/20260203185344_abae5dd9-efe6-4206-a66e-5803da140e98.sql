-- Reset tópico FGTS que está travado em "gerando"
UPDATE oab_trilhas_topicos 
SET status = 'pendente', progresso = 0, updated_at = NOW() 
WHERE id = 737;