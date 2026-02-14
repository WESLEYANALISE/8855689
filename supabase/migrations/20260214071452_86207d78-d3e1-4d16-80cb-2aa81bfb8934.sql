
-- Create categorias_materia_paginas table for storing raw PDF pages
CREATE TABLE IF NOT EXISTS public.categorias_materia_paginas (
  id SERIAL PRIMARY KEY,
  materia_id INTEGER NOT NULL REFERENCES public.categorias_materias(id) ON DELETE CASCADE,
  pagina INTEGER NOT NULL,
  conteudo TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(materia_id, pagina)
);

-- Enable RLS
ALTER TABLE public.categorias_materia_paginas ENABLE ROW LEVEL SECURITY;

-- Allow public read (same pattern as other categorias tables)
CREATE POLICY "Allow public read categorias_materia_paginas" 
  ON public.categorias_materia_paginas FOR SELECT USING (true);

-- Allow service role to insert/update/delete
CREATE POLICY "Allow service role write categorias_materia_paginas"
  ON public.categorias_materia_paginas FOR ALL
  USING (true) WITH CHECK (true);
