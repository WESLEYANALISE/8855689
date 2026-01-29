-- RPC para retornar estatísticas de áreas de flashcards de forma otimizada
CREATE OR REPLACE FUNCTION get_flashcard_areas_stats()
RETURNS TABLE(
  area TEXT, 
  total_flashcards BIGINT, 
  total_temas BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH areas_resumo AS (
    SELECT DISTINCT 
      TRIM(r.area) as area_nome,
      COUNT(DISTINCT LOWER(TRIM(r.tema))) as temas_count
    FROM "RESUMO" r
    WHERE r.area IS NOT NULL AND TRIM(r.area) != ''
    GROUP BY TRIM(r.area)
  ),
  flashcards_count AS (
    SELECT 
      TRIM(f.area) as area_nome,
      COUNT(*)::BIGINT as fc_count
    FROM "FLASHCARDS_GERADOS" f
    WHERE f.area IS NOT NULL AND TRIM(f.area) != ''
    GROUP BY TRIM(f.area)
  )
  SELECT 
    ar.area_nome::TEXT as area,
    COALESCE(fc.fc_count, 0)::BIGINT as total_flashcards,
    ar.temas_count::BIGINT as total_temas
  FROM areas_resumo ar
  LEFT JOIN flashcards_count fc ON LOWER(TRIM(fc.area_nome)) = LOWER(TRIM(ar.area_nome))
  ORDER BY ar.area_nome;
END;
$$;