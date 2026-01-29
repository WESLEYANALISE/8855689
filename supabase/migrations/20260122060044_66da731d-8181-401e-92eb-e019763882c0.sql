-- Create table to cache term definitions
CREATE TABLE public.cache_definicoes_termos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  termo TEXT NOT NULL,
  termo_normalizado TEXT NOT NULL,
  definicao TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique index on normalized term for efficient lookups
CREATE UNIQUE INDEX idx_cache_definicoes_termo_normalizado ON public.cache_definicoes_termos (termo_normalizado);

-- Create index for faster searches
CREATE INDEX idx_cache_definicoes_termo ON public.cache_definicoes_termos (termo);

-- Enable RLS
ALTER TABLE public.cache_definicoes_termos ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read definitions (they are public educational content)
CREATE POLICY "Definitions are publicly readable"
ON public.cache_definicoes_termos
FOR SELECT
USING (true);

-- Allow edge functions to insert/update definitions
CREATE POLICY "Service role can manage definitions"
ON public.cache_definicoes_termos
FOR ALL
USING (true)
WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_cache_definicoes_updated_at
BEFORE UPDATE ON public.cache_definicoes_termos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();