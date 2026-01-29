-- Reset news processing to apply new AI formatting
UPDATE public.noticias_oab_cache
SET 
  processado = false,
  conteudo_completo = NULL,
  erro_processamento = NULL
WHERE processado = true;