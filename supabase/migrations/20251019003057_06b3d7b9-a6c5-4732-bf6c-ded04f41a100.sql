-- Criar tabela para cache de pesquisas
CREATE TABLE IF NOT EXISTS public.cache_pesquisas (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  termo_pesquisado text NOT NULL UNIQUE,
  resultados jsonb NOT NULL DEFAULT '{}'::jsonb,
  total_resultados integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  versao integer NOT NULL DEFAULT 1
);

-- Índices para melhorar performance
CREATE INDEX idx_cache_pesquisas_termo ON public.cache_pesquisas(termo_pesquisado);
CREATE INDEX idx_cache_pesquisas_updated_at ON public.cache_pesquisas(updated_at DESC);

-- Habilitar RLS
ALTER TABLE public.cache_pesquisas ENABLE ROW LEVEL SECURITY;

-- Policy: público pode ler (SELECT)
CREATE POLICY "Cache de pesquisas é público para leitura"
ON public.cache_pesquisas
FOR SELECT
USING (true);

-- Policy: sistema pode inserir
CREATE POLICY "Sistema pode inserir cache"
ON public.cache_pesquisas
FOR INSERT
WITH CHECK (true);

-- Policy: sistema pode atualizar
CREATE POLICY "Sistema pode atualizar cache"
ON public.cache_pesquisas
FOR UPDATE
USING (true);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_cache_pesquisas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.versao = OLD.versao + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar timestamp
CREATE TRIGGER trigger_update_cache_pesquisas_updated_at
BEFORE UPDATE ON public.cache_pesquisas
FOR EACH ROW
EXECUTE FUNCTION public.update_cache_pesquisas_updated_at();