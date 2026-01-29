-- Reset tópico 4 para regenerar com imagens via Gemini direto
UPDATE faculdade_topicos 
SET 
  conteudo_gerado = NULL,
  status = 'pendente',
  imagens_diagramas = '[]'::jsonb
WHERE id = 4;