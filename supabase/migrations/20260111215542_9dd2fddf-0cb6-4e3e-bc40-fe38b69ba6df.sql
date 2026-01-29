-- Add new columns to videoaulas_iniciante for AI-generated content
ALTER TABLE public.videoaulas_iniciante 
ADD COLUMN IF NOT EXISTS transcricao TEXT,
ADD COLUMN IF NOT EXISTS sobre_aula TEXT,
ADD COLUMN IF NOT EXISTS questoes JSONB;