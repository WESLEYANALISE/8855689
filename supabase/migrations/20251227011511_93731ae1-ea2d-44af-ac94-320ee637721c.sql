-- Permitir leitura pública da tabela flashcards_areas_capas
CREATE POLICY "Allow public read access"
ON public.flashcards_areas_capas
FOR SELECT
USING (true);