-- Renomear tabela flashcards_areas_capas para flashcards_areas
ALTER TABLE public.flashcards_areas_capas RENAME TO flashcards_areas;

-- Atualizar a policy para o novo nome
DROP POLICY IF EXISTS "Allow public read access" ON public.flashcards_areas;
CREATE POLICY "Allow public read access"
ON public.flashcards_areas
FOR SELECT
USING (true);