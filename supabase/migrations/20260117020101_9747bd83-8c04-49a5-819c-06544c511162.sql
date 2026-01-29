-- Reset tópico Emancipação (id=11) para regenerar com modelo correto
UPDATE faculdade_topicos 
SET 
  conteudo_gerado = NULL,
  status = 'pendente',
  imagens_diagramas = '[]'::jsonb
WHERE id = 11;