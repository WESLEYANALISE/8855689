-- Create cache table for Complete Lei exercises
CREATE TABLE public."COMPLETE_LEI_CACHE" (
  id SERIAL PRIMARY KEY,
  area TEXT NOT NULL,
  artigo TEXT NOT NULL,
  texto_com_lacunas TEXT NOT NULL,
  palavras JSONB NOT NULL,
  lacunas JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(area, artigo)
);

-- Enable RLS
ALTER TABLE public."COMPLETE_LEI_CACHE" ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access"
ON public."COMPLETE_LEI_CACHE"
FOR SELECT
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_complete_lei_cache_area_artigo 
ON public."COMPLETE_LEI_CACHE" (area, artigo);