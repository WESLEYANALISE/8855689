-- Criar tabela para armazenar capas por código legal
CREATE TABLE IF NOT EXISTS public.codigos_capas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo_tabela TEXT NOT NULL UNIQUE,
  codigo_nome TEXT NOT NULL,
  capa_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar comentário à tabela
COMMENT ON TABLE public.codigos_capas IS 'Armazena capas únicas por código legal (CP, CC, CF) para reutilização em artigos';

-- Criar índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_codigos_capas_codigo ON public.codigos_capas(codigo_tabela);

-- Habilitar RLS
ALTER TABLE public.codigos_capas ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública (capas são públicas)
CREATE POLICY "Capas são visíveis publicamente" 
ON public.codigos_capas 
FOR SELECT 
USING (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE TRIGGER update_codigos_capas_updated_at
BEFORE UPDATE ON public.codigos_capas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();