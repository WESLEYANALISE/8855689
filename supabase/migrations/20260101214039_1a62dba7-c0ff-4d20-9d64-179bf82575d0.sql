-- Create a table for article annotations/notes
CREATE TABLE public.artigos_anotacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tabela_codigo TEXT NOT NULL,
  numero_artigo TEXT NOT NULL,
  artigo_id INTEGER NOT NULL,
  anotacao TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, tabela_codigo, numero_artigo)
);

-- Enable Row Level Security
ALTER TABLE public.artigos_anotacoes ENABLE ROW LEVEL SECURITY;

-- Create policies for user access (users can only see/edit their own annotations)
CREATE POLICY "Users can view their own annotations" 
ON public.artigos_anotacoes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own annotations" 
ON public.artigos_anotacoes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own annotations" 
ON public.artigos_anotacoes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own annotations" 
ON public.artigos_anotacoes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_artigos_anotacoes_user ON public.artigos_anotacoes(user_id);
CREATE INDEX idx_artigos_anotacoes_artigo ON public.artigos_anotacoes(tabela_codigo, numero_artigo);