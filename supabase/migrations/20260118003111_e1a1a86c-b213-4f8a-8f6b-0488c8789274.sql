-- Resetar status do tópico 108 para pendente
UPDATE conceitos_topicos 
SET status = 'pendente', updated_at = now() 
WHERE id = 108;