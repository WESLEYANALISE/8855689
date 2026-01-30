-- Criar tabela conceitos_topico_paginas (igual a oab_trilhas_topico_paginas)
-- Para armazenar páginas do PDF por tópico, não por matéria

CREATE TABLE IF NOT EXISTS public.conceitos_topico_paginas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topico_id INTEGER NOT NULL REFERENCES public.conceitos_topicos(id) ON DELETE CASCADE,
  pagina INTEGER NOT NULL,
  conteudo TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(topico_id, pagina)
);

-- Criar índice para busca rápida por topico_id
CREATE INDEX IF NOT EXISTS idx_conceitos_topico_paginas_topico_id ON public.conceitos_topico_paginas(topico_id);

-- Adicionar coluna posicao_fila na tabela conceitos_topicos (se não existir)
ALTER TABLE public.conceitos_topicos ADD COLUMN IF NOT EXISTS posicao_fila INTEGER;

-- Habilitar RLS
ALTER TABLE public.conceitos_topico_paginas ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública (conteúdo educacional)
CREATE POLICY "conceitos_topico_paginas_select_policy" 
ON public.conceitos_topico_paginas 
FOR SELECT 
USING (true);

-- Política de inserção para service role (edge functions)
CREATE POLICY "conceitos_topico_paginas_insert_policy" 
ON public.conceitos_topico_paginas 
FOR INSERT 
WITH CHECK (true);

-- Política de update para service role
CREATE POLICY "conceitos_topico_paginas_update_policy" 
ON public.conceitos_topico_paginas 
FOR UPDATE 
USING (true);

-- Política de delete para service role
CREATE POLICY "conceitos_topico_paginas_delete_policy" 
ON public.conceitos_topico_paginas 
FOR DELETE 
USING (true);