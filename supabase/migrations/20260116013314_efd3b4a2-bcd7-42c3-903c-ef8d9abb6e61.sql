-- Tabela para subtópicos com aulas expandidas
CREATE TABLE public.oab_trilhas_subtopicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tema_id uuid REFERENCES public.oab_trilhas_temas(id) ON DELETE CASCADE,
  ordem int NOT NULL DEFAULT 1,
  titulo text NOT NULL,
  conteudo_expandido text,
  flashcards jsonb DEFAULT '[]'::jsonb,
  questoes jsonb DEFAULT '[]'::jsonb,
  exemplos_praticos jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'pendente',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índice para busca por tema
CREATE INDEX idx_oab_trilhas_subtopicos_tema_id ON public.oab_trilhas_subtopicos(tema_id);

-- Coluna para controle de subtópicos gerados
ALTER TABLE public.oab_trilhas_temas 
ADD COLUMN IF NOT EXISTS subtopicos_gerados boolean DEFAULT false;

-- RLS
ALTER TABLE public.oab_trilhas_subtopicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subtópicos são públicos para leitura" 
ON public.oab_trilhas_subtopicos 
FOR SELECT 
USING (true);

CREATE POLICY "Service role pode gerenciar subtópicos" 
ON public.oab_trilhas_subtopicos 
FOR ALL 
USING (true)
WITH CHECK (true);