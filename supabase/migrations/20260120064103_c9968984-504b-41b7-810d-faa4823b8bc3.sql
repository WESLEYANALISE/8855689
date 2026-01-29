-- Resetar processamento das notícias existentes para aplicar novas correções
UPDATE public.noticias_oab_cache
SET 
  processado = false,
  capa_gerada = NULL,
  conteudo_completo = NULL,
  erro_processamento = NULL
WHERE processado = true;