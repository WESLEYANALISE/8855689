-- Resetar status do tópico 108 que ficou travado em "gerando"
UPDATE conceitos_topicos 
SET status = 'pendente', updated_at = now() 
WHERE id = 108;