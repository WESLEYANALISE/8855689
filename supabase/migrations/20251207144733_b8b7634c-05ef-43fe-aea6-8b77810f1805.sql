UPDATE "BIBLIOTECA-CLASSICOS" 
SET 
  resumo_capitulos = NULL,
  questoes_resumo = NULL,
  capitulos_gerados = NULL,
  total_capitulos = NULL,
  resumo_gerado_em = NULL
WHERE resumo_gerado_em IS NOT NULL;