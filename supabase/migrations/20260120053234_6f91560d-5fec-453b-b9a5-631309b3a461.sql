-- Create table for OAB news cache
CREATE TABLE public.noticias_oab_cache (
  id BIGSERIAL PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  link TEXT UNIQUE NOT NULL,
  data_publicacao TIMESTAMPTZ,
  hora_publicacao TEXT,
  categoria TEXT,
  conteudo_completo TEXT,
  capa_gerada TEXT,
  links_externos JSONB DEFAULT '[]'::jsonb,
  processado BOOLEAN DEFAULT false,
  erro_processamento TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_noticias_oab_cache_data ON public.noticias_oab_cache(data_publicacao DESC);
CREATE INDEX idx_noticias_oab_cache_processado ON public.noticias_oab_cache(processado);

-- Enable RLS
ALTER TABLE public.noticias_oab_cache ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access to OAB news"
ON public.noticias_oab_cache
FOR SELECT
USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_noticias_oab_cache_updated_at
BEFORE UPDATE ON public.noticias_oab_cache
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();