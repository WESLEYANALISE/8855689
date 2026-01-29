-- Função para contar flashcards por área usando GROUP BY
CREATE OR REPLACE FUNCTION get_flashcard_artigos_count()
RETURNS TABLE(area text, total bigint)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT area, COUNT(*)::bigint as total
  FROM "FLASHCARDS - ARTIGOS LEI"
  WHERE area IS NOT NULL
  GROUP BY area
  ORDER BY total DESC;
$$;