-- Adicionar coluna correspondencias para jogo de arrastar
ALTER TABLE public.biblioteca_classicos_temas 
ADD COLUMN IF NOT EXISTS correspondencias JSONB DEFAULT NULL;

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.biblioteca_classicos_temas.correspondencias IS 'Pares de conceito-definição para jogo de correspondência';