-- Zerar conteúdos já gerados para regenerar no novo formato enriquecido
UPDATE faculdade_topicos 
SET 
  conteudo_gerado = NULL,
  status = 'pendente'
WHERE conteudo_gerado IS NOT NULL;