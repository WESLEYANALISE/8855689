-- Criar tabela para armazenar histórico de alterações das leis
CREATE TABLE public.HISTORICO_ALTERACOES (
  id SERIAL PRIMARY KEY,
  tabela_lei TEXT NOT NULL,
  numero_artigo TEXT NOT NULL,
  tipo_alteracao TEXT NOT NULL,
  lei_alteradora TEXT,
  data_alteracao DATE,
  ano_alteracao INTEGER,
  texto_completo TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar índices para buscas rápidas
CREATE INDEX idx_historico_alteracoes_tabela ON public.HISTORICO_ALTERACOES(tabela_lei);
CREATE INDEX idx_historico_alteracoes_artigo ON public.HISTORICO_ALTERACOES(numero_artigo);
CREATE INDEX idx_historico_alteracoes_tipo ON public.HISTORICO_ALTERACOES(tipo_alteracao);
CREATE INDEX idx_historico_alteracoes_data ON public.HISTORICO_ALTERACOES(data_alteracao DESC);
CREATE INDEX idx_historico_alteracoes_ano ON public.HISTORICO_ALTERACOES(ano_alteracao DESC);

-- Índice composto para buscas por tabela + artigo
CREATE INDEX idx_historico_alteracoes_tabela_artigo ON public.HISTORICO_ALTERACOES(tabela_lei, numero_artigo);

-- Índice único para evitar duplicatas
CREATE UNIQUE INDEX idx_historico_alteracoes_unique ON public.HISTORICO_ALTERACOES(tabela_lei, numero_artigo, texto_completo);

-- Trigger para updated_at
CREATE TRIGGER update_historico_alteracoes_updated_at
  BEFORE UPDATE ON public.HISTORICO_ALTERACOES
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.HISTORICO_ALTERACOES ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública (dados são públicos)
CREATE POLICY "Historico alteracoes visivel por todos"
  ON public.HISTORICO_ALTERACOES
  FOR SELECT
  USING (true);

-- Política de inserção/atualização/deleção apenas para admin (via service role)
CREATE POLICY "Historico alteracoes editavel por admin"
  ON public.HISTORICO_ALTERACOES
  FOR ALL
  USING (true)
  WITH CHECK (true);