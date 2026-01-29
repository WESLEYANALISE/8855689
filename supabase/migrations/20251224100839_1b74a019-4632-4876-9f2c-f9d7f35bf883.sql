-- Função para limpar notícias antigas e retornar URLs de imagens para deletar
CREATE OR REPLACE FUNCTION public.limpar_noticias_antigas(dias_reter INTEGER DEFAULT 7)
RETURNS TABLE (
  tabela TEXT,
  registros_deletados BIGINT,
  imagens_para_deletar TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  imagens_juridicas TEXT[];
  imagens_politicas TEXT[];
  count_juridicas BIGINT;
  count_politicas BIGINT;
BEGIN
  -- Coletar URLs de imagens antes de deletar (noticias_juridicas_cache)
  SELECT ARRAY_AGG(imagem) INTO imagens_juridicas
  FROM noticias_juridicas_cache
  WHERE imagem IS NOT NULL 
    AND imagem != ''
    AND data_publicacao < CURRENT_DATE - (dias_reter || ' days')::INTERVAL;

  -- Coletar URLs de imagens antes de deletar (noticias_politicas_cache)
  SELECT ARRAY_AGG(imagem_url) INTO imagens_politicas
  FROM noticias_politicas_cache
  WHERE imagem_url IS NOT NULL 
    AND imagem_url != ''
    AND data_publicacao < CURRENT_DATE - (dias_reter || ' days')::INTERVAL;

  -- Deletar notícias jurídicas antigas
  DELETE FROM noticias_juridicas_cache
  WHERE data_publicacao < CURRENT_DATE - (dias_reter || ' days')::INTERVAL;
  GET DIAGNOSTICS count_juridicas = ROW_COUNT;

  -- Deletar notícias políticas antigas
  DELETE FROM noticias_politicas_cache
  WHERE data_publicacao < CURRENT_DATE - (dias_reter || ' days')::INTERVAL;
  GET DIAGNOSTICS count_politicas = ROW_COUNT;

  -- Retornar resultados
  RETURN QUERY
  SELECT 'noticias_juridicas_cache'::TEXT, count_juridicas, COALESCE(imagens_juridicas, ARRAY[]::TEXT[])
  UNION ALL
  SELECT 'noticias_politicas_cache'::TEXT, count_politicas, COALESCE(imagens_politicas, ARRAY[]::TEXT[]);
END;
$$;

-- Conceder permissão para o service role executar
GRANT EXECUTE ON FUNCTION public.limpar_noticias_antigas TO service_role;