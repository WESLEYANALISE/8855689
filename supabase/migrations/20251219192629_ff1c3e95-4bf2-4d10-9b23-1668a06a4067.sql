-- Tabela para histórico de leis raspadas com validação cruzada
CREATE TABLE IF NOT EXISTS public.cache_leis_raspadas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_tabela TEXT NOT NULL,
  url_planalto TEXT,
  total_artigos INTEGER NOT NULL DEFAULT 0,
  artigos_com_lacunas INTEGER DEFAULT 0,
  percentual_extracao NUMERIC(5,2),
  fontes_usadas TEXT[] DEFAULT '{}',
  metodo_final INTEGER DEFAULT 1,
  relatorio_raspagem TEXT,
  analise_lacunas JSONB,
  hash_conteudo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(nome_tabela)
);

-- Enable RLS
ALTER TABLE public.cache_leis_raspadas ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública
CREATE POLICY "Cache leis é público para leitura" 
ON public.cache_leis_raspadas 
FOR SELECT 
USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_cache_leis_raspadas_updated_at
BEFORE UPDATE ON public.cache_leis_raspadas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();