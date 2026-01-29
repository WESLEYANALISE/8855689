-- Create table for extracted PDF pages for OAB Trilhas topicos
CREATE TABLE public.oab_trilhas_topico_paginas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topico_id INTEGER NOT NULL,
    pagina INTEGER NOT NULL,
    conteudo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(topico_id, pagina)
);

-- Enable RLS
ALTER TABLE public.oab_trilhas_topico_paginas ENABLE ROW LEVEL SECURITY;

-- Allow public read access (content is for processing)
CREATE POLICY "Allow public read access on oab_trilhas_topico_paginas" 
ON public.oab_trilhas_topico_paginas 
FOR SELECT 
USING (true);

-- Allow service role to insert/update/delete
CREATE POLICY "Allow service role full access on oab_trilhas_topico_paginas" 
ON public.oab_trilhas_topico_paginas 
FOR ALL 
USING (true)
WITH CHECK (true);