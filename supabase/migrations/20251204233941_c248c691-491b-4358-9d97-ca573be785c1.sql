-- Função para obter estatísticas de áreas com questões
CREATE OR REPLACE FUNCTION public.get_questoes_areas_stats()
RETURNS TABLE (
  area text,
  total_temas bigint,
  total_questoes bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH temas_por_area AS (
    SELECT 
      r.area,
      COUNT(DISTINCT r.tema) as total_temas
    FROM "RESUMO" r
    WHERE r.area IS NOT NULL AND r.tema IS NOT NULL
    GROUP BY r.area
  ),
  questoes_por_area AS (
    SELECT 
      q.area,
      COUNT(*) as total_questoes
    FROM "QUESTOES_GERADAS" q
    WHERE q.area IS NOT NULL
    GROUP BY q.area
  )
  SELECT 
    COALESCE(t.area, q.area) as area,
    COALESCE(t.total_temas, 0) as total_temas,
    COALESCE(q.total_questoes, 0) as total_questoes
  FROM temas_por_area t
  FULL OUTER JOIN questoes_por_area q ON t.area = q.area
  ORDER BY area;
$$;