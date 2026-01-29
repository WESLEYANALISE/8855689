-- Limpar cache de aulas de Direito Constitucional
DELETE FROM jornada_aulas_cache WHERE area ILIKE '%constitucional%';

-- Limpar conteúdo gerado nos resumos de Direito Constitucional
UPDATE "RESUMO" 
SET conteudo_gerado = NULL, ultima_atualizacao = NULL
WHERE area ILIKE '%constitucional%';