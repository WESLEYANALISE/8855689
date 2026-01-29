-- Resetar processamento para testar geração de imagem com chaves Gemini
UPDATE public.noticias_oab_cache
SET 
  processado = false,
  capa_gerada = NULL,
  conteudo_completo = NULL,
  erro_processamento = NULL;