-- Criar tabela para armazenar pesquisas de TCC
CREATE TABLE public.tcc_pesquisas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  autor TEXT,
  ano INTEGER,
  instituicao TEXT,
  tipo TEXT CHECK (tipo IN ('tcc', 'dissertacao', 'tese')),
  area_direito TEXT,
  subarea TEXT,
  link_acesso TEXT,
  resumo_original TEXT,
  resumo_ia TEXT,
  tema_central TEXT,
  problema_pesquisa TEXT,
  objetivo_geral TEXT,
  metodologia TEXT,
  principais_conclusoes TEXT,
  contribuicoes TEXT,
  sugestoes_abordagem TEXT[],
  relevancia TEXT CHECK (relevancia IN ('alta', 'media', 'baixa')),
  fonte TEXT,
  pdf_url TEXT,
  texto_completo TEXT,
  tema_saturado BOOLEAN DEFAULT false,
  atualizacoes_necessarias TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.tcc_pesquisas ENABLE ROW LEVEL SECURITY;

-- Política para leitura pública (pesquisas são públicas)
CREATE POLICY "Qualquer pessoa pode ver TCCs"
ON public.tcc_pesquisas
FOR SELECT
USING (true);

-- Política para inserção (qualquer pessoa pode adicionar)
CREATE POLICY "Qualquer pessoa pode adicionar TCCs"
ON public.tcc_pesquisas
FOR INSERT
WITH CHECK (true);

-- Política para atualização
CREATE POLICY "Qualquer pessoa pode atualizar TCCs"
ON public.tcc_pesquisas
FOR UPDATE
USING (true);

-- Índices para performance
CREATE INDEX idx_tcc_pesquisas_area ON public.tcc_pesquisas(area_direito);
CREATE INDEX idx_tcc_pesquisas_tipo ON public.tcc_pesquisas(tipo);
CREATE INDEX idx_tcc_pesquisas_ano ON public.tcc_pesquisas(ano);
CREATE INDEX idx_tcc_pesquisas_titulo ON public.tcc_pesquisas USING gin(to_tsvector('portuguese', titulo));

-- Trigger para updated_at
CREATE TRIGGER update_tcc_pesquisas_updated_at
BEFORE UPDATE ON public.tcc_pesquisas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();