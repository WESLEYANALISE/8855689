-- Adicionar coluna slides_json na tabela aulas_artigos para armazenar slides no formato ConceitosSlidesViewer
ALTER TABLE public.aulas_artigos 
ADD COLUMN IF NOT EXISTS slides_json JSONB;

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.aulas_artigos.slides_json IS 'Slides no formato ConceitoSlidesData para compatibilidade com ConceitosSlidesViewer';