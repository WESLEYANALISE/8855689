-- Drop existing constraints and indexes if they exist
DROP INDEX IF EXISTS idx_leitura_paginas_livro_pagina;

-- Add livro_titulo column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leitura_paginas_formatadas' AND column_name = 'livro_titulo') THEN
    ALTER TABLE public.leitura_paginas_formatadas ADD COLUMN livro_titulo TEXT;
  END IF;
END $$;

-- Add capitulo_titulo column for chapter tracking
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leitura_paginas_formatadas' AND column_name = 'capitulo_titulo') THEN
    ALTER TABLE public.leitura_paginas_formatadas ADD COLUMN capitulo_titulo TEXT;
  END IF;
END $$;

-- Add is_chapter_start column to mark chapter beginnings
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leitura_paginas_formatadas' AND column_name = 'is_chapter_start') THEN
    ALTER TABLE public.leitura_paginas_formatadas ADD COLUMN is_chapter_start BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Create unique index on livro_titulo + numero_pagina
CREATE UNIQUE INDEX IF NOT EXISTS idx_leitura_paginas_titulo_pagina 
ON public.leitura_paginas_formatadas (livro_titulo, numero_pagina);

-- Create index for chapter queries
CREATE INDEX IF NOT EXISTS idx_leitura_paginas_capitulo 
ON public.leitura_paginas_formatadas (livro_titulo, is_chapter_start) 
WHERE is_chapter_start = true;