-- Criar tabela para armazenar capas das carreiras
CREATE TABLE IF NOT EXISTS public.carreiras_capas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  carreira TEXT NOT NULL UNIQUE,
  url_capa TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.carreiras_capas ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública
CREATE POLICY "Capas de carreiras são públicas para leitura" 
ON public.carreiras_capas 
FOR SELECT 
USING (true);

-- Política de inserção/atualização para sistema
CREATE POLICY "Sistema pode inserir capas de carreiras" 
ON public.carreiras_capas 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Sistema pode atualizar capas de carreiras" 
ON public.carreiras_capas 
FOR UPDATE 
USING (true);

-- Índice para busca por carreira
CREATE INDEX idx_carreiras_capas_carreira ON public.carreiras_capas(carreira);