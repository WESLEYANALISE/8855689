-- Criar ou atualizar a função RPC para buscar áreas de flashcards
CREATE OR REPLACE FUNCTION public.get_flashcard_areas_from_gerados()
RETURNS TABLE(area text, total_flashcards bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    area,
    COUNT(*)::bigint as total_flashcards
  FROM "FLASHCARDS_GERADOS"
  WHERE area IS NOT NULL
  GROUP BY area
  ORDER BY area;
$$;