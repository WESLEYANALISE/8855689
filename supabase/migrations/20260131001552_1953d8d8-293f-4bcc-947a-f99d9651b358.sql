-- Resetar o tópico para testar a nova geração
UPDATE conceitos_topicos
SET status = 'pendente', progresso = 0, tentativas = 0
WHERE id = 539;