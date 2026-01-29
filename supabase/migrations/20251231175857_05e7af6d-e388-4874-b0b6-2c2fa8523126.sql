-- Add duracao column to jornada_progresso_usuario
ALTER TABLE public.jornada_progresso_usuario 
ADD COLUMN IF NOT EXISTS duracao INTEGER DEFAULT NULL;

-- Add comment explaining the field
COMMENT ON COLUMN public.jornada_progresso_usuario.duracao IS 'Duração escolhida em dias (30, 60, 90, 180, 365). NULL = modo completo (1 artigo/dia)';

-- Add artigos_por_dia for quick reference
ALTER TABLE public.jornada_progresso_usuario 
ADD COLUMN IF NOT EXISTS artigos_por_dia INTEGER DEFAULT 1;

-- Add total_artigos for the selected area
ALTER TABLE public.jornada_progresso_usuario 
ADD COLUMN IF NOT EXISTS total_artigos INTEGER DEFAULT 0;