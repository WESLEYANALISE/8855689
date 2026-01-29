-- Garantir que a RPC é acessível publicamente
GRANT EXECUTE ON FUNCTION get_flashcard_areas_from_gerados() TO anon, authenticated;