-- Resetar tópico 2 para regenerar
UPDATE faculdade_topicos 
SET 
  conteudo_gerado = NULL,
  status = 'pendente'
WHERE id = 2;