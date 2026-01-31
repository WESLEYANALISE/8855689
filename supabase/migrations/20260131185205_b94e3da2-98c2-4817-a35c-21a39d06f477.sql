UPDATE conceitos_topicos 
SET status = 'concluido', progresso = 100 
WHERE id = 634 AND slides_json IS NOT NULL;