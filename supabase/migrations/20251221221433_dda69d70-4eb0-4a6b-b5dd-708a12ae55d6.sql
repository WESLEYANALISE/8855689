-- Tabela para armazenar explicações geradas pela IA (cache)
CREATE TABLE public.cache_explicacoes_estatisticas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL,
  dados_hash TEXT NOT NULL,
  explicacao TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_tipo_hash UNIQUE(tipo, dados_hash)
);

-- Habilitar RLS
ALTER TABLE public.cache_explicacoes_estatisticas ENABLE ROW LEVEL SECURITY;

-- Política para leitura pública (as explicações podem ser lidas por qualquer um)
CREATE POLICY "Explicações podem ser lidas por qualquer usuário"
ON public.cache_explicacoes_estatisticas
FOR SELECT
USING (true);

-- Política para inserção (apenas o serviço pode inserir)
CREATE POLICY "Explicações podem ser inseridas pelo serviço"
ON public.cache_explicacoes_estatisticas
FOR INSERT
WITH CHECK (true);

-- Política para atualização
CREATE POLICY "Explicações podem ser atualizadas"
ON public.cache_explicacoes_estatisticas
FOR UPDATE
USING (true);

-- Índice para busca rápida
CREATE INDEX idx_cache_explicacoes_tipo_hash 
ON public.cache_explicacoes_estatisticas(tipo, dados_hash);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_cache_explicacoes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_cache_explicacoes_timestamp
BEFORE UPDATE ON public.cache_explicacoes_estatisticas
FOR EACH ROW
EXECUTE FUNCTION public.update_cache_explicacoes_updated_at();