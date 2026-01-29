-- Limpar conteúdos gerados com legislação inventada na tabela RESUMO
UPDATE "RESUMO" 
SET conteudo_gerado = NULL, 
    url_imagem_resumo = NULL,
    conteudo = NULL
WHERE area IN ('Direito Constitucional', 'Ética Profissional', 'Filosofia do Direito');

-- Resetar status dos tópicos OAB para permitir re-processamento dos subtemas
UPDATE oab_trilhas_topicos
SET status = 'pendente',
    conteudo_gerado = NULL,
    capa_url = NULL
WHERE materia_id IN (
  SELECT id FROM oab_trilhas_materias 
  WHERE nome IN ('Direito Constitucional', 'Ética Profissional', 'Filosofia do Direito')
);