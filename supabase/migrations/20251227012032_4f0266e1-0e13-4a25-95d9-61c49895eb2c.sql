-- Criar função para buscar áreas de flashcards com contagem
CREATE OR REPLACE FUNCTION get_flashcard_areas_from_gerados()
RETURNS TABLE (
  area TEXT,
  total_flashcards BIGINT
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT area, COUNT(*) as total_flashcards
  FROM "FLASHCARDS_GERADOS"
  WHERE area IS NOT NULL
  GROUP BY area
  ORDER BY area;
$$;