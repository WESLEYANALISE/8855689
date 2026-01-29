-- Limpar todos os temas existentes da trilha conceitos_1 para reprocessar
DELETE FROM conceitos_livro_temas WHERE trilha = 'conceitos_1';

-- Resetar status da trilha para permitir nova análise
UPDATE conceitos_trilhas 
SET status = 'extraido', total_temas = 0 
WHERE codigo = 'conceitos_1';