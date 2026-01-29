-- Create table for monitoring new laws
CREATE TABLE public.leis_push (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_lei TEXT NOT NULL,
  ementa TEXT,
  data_publicacao DATE,
  url_planalto TEXT NOT NULL,
  texto_bruto TEXT,
  texto_formatado TEXT,
  artigos JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'publicado')),
  areas_direito TEXT[] DEFAULT '{}',
  tabela_destino TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leis_push ENABLE ROW LEVEL SECURITY;

-- Create public read policy for published laws
CREATE POLICY "Leis publicadas são visíveis para todos"
ON public.leis_push
FOR SELECT
USING (status = 'publicado');

-- Create admin policy for all operations (public for now - admin auth can be added later)
CREATE POLICY "Acesso total para gerenciamento"
ON public.leis_push
FOR ALL
USING (true)
WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_leis_push_status ON public.leis_push(status);
CREATE INDEX idx_leis_push_data_publicacao ON public.leis_push(data_publicacao DESC);
CREATE INDEX idx_leis_push_numero_lei ON public.leis_push(numero_lei);

-- Create trigger for updated_at
CREATE TRIGGER update_leis_push_updated_at
BEFORE UPDATE ON public.leis_push
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();