-- Criar tabela para cache de proposições recentes
CREATE TABLE IF NOT EXISTS public.cache_proposicoes_recentes (
  id bigserial PRIMARY KEY,
  id_proposicao bigint UNIQUE NOT NULL,
  sigla_tipo text NOT NULL,
  numero integer NOT NULL,
  ano integer NOT NULL,
  ementa text NOT NULL,
  titulo_gerado_ia text,
  data_apresentacao timestamp with time zone,
  autor_principal_id bigint,
  autor_principal_nome text,
  autor_principal_foto text,
  autor_principal_partido text,
  autor_principal_uf text,
  url_inteiro_teor text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.cache_proposicoes_recentes ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública
CREATE POLICY "Proposições são públicas para leitura"
ON public.cache_proposicoes_recentes
FOR SELECT
USING (true);

-- Política para sistema inserir
CREATE POLICY "Sistema pode inserir proposições"
ON public.cache_proposicoes_recentes
FOR INSERT
WITH CHECK (true);

-- Política para sistema atualizar
CREATE POLICY "Sistema pode atualizar proposições"
ON public.cache_proposicoes_recentes
FOR UPDATE
USING (true);

-- Índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_proposicoes_data ON public.cache_proposicoes_recentes(data_apresentacao DESC);
CREATE INDEX IF NOT EXISTS idx_proposicoes_updated ON public.cache_proposicoes_recentes(updated_at DESC);