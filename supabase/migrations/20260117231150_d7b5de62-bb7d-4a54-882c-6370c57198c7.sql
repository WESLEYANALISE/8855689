-- Adicionar coluna para capa gerada nas matérias do Trilhante
ALTER TABLE public.conceitos_materias
ADD COLUMN IF NOT EXISTS capa_url TEXT;