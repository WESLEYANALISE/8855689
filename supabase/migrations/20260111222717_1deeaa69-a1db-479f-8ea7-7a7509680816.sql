-- Add flashcards column to videoaulas_iniciante table
ALTER TABLE public.videoaulas_iniciante 
ADD COLUMN IF NOT EXISTS flashcards JSONB DEFAULT NULL;