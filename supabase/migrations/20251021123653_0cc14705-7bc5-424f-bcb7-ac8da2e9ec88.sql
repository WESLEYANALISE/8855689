-- Criar tabela de cache para Câmara dos Deputados
CREATE TABLE IF NOT EXISTS public.cache_camara_deputados (
  id BIGSERIAL PRIMARY KEY,
  tipo_cache TEXT NOT NULL,
  chave_cache TEXT NOT NULL,
  dados JSONB NOT NULL,
  total_registros INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expira_em TIMESTAMPTZ,
  versao INTEGER DEFAULT 1
);

-- Índices para performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_cache_camara_tipo_chave ON public.cache_camara_deputados(tipo_cache, chave_cache);
CREATE INDEX IF NOT EXISTS idx_cache_camara_expiracao ON public.cache_camara_deputados(expira_em);

-- Habilitar RLS
ALTER TABLE public.cache_camara_deputados ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública
CREATE POLICY "Cache é público para leitura"
ON public.cache_camara_deputados
FOR SELECT
USING (true);

-- Política de escrita do sistema
CREATE POLICY "Sistema pode inserir cache"
ON public.cache_camara_deputados
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Sistema pode atualizar cache"
ON public.cache_camara_deputados
FOR UPDATE
USING (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_cache_camara_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.versao = OLD.versao + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_cache_camara_deputados_updated_at
  BEFORE UPDATE ON public.cache_camara_deputados
  FOR EACH ROW
  EXECUTE FUNCTION public.update_cache_camara_updated_at();