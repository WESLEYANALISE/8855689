-- Resetar tópico 1 para regenerar com novo prompt (com diagramas mermaid)
UPDATE faculdade_topicos 
SET 
  conteudo_gerado = NULL,
  status = 'pendente'
WHERE id = 1;