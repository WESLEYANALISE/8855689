-- Resetar o tópico 469 para permitir novo processamento de PDF
UPDATE oab_trilhas_topicos 
SET 
  status = 'pendente'
WHERE id = 469;