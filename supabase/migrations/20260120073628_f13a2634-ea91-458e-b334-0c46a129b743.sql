-- Reset news to reprocess with improved AI formatting
UPDATE public.noticias_oab_cache
SET 
  processado = false,
  conteudo_completo = NULL,
  erro_processamento = NULL
WHERE processado = true;