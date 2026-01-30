-- Forçar reset do tópico que ainda está "gerando"
UPDATE conceitos_topicos 
SET status = 'pendente', progresso = 0, conteudo_gerado = NULL, tentativas = 0
WHERE id = 533;