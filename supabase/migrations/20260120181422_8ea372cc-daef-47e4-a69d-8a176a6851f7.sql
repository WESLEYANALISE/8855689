-- Limpar conteúdo gerado de Direito Constitucional (mantendo capas)
UPDATE "RESUMO"
SET 
  conteudo_gerado = NULL,
  ultima_atualizacao = NULL
WHERE area ILIKE '%Constitucional%';

-- Limpar também o cache de aulas para Direito Constitucional
DELETE FROM jornada_aulas_cache
WHERE area ILIKE '%Constitucional%';