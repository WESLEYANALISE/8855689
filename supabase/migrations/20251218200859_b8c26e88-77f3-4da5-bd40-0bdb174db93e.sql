-- Tabela de legislações disponíveis no Corpus 927
CREATE TABLE public.legislacoes_corpus927 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  nome_completo TEXT NOT NULL,
  sigla TEXT,
  url_base TEXT NOT NULL,
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.legislacoes_corpus927 ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública
CREATE POLICY "Legislações são públicas para leitura"
ON public.legislacoes_corpus927
FOR SELECT
USING (true);

-- Inserir legislações pré-configuradas
INSERT INTO public.legislacoes_corpus927 (codigo, nome_completo, sigla, url_base) VALUES
('cp-40', 'Código Penal', 'CP', 'https://corpus927.enfam.jus.br/legislacao/cp-40'),
('cpp-41', 'Código de Processo Penal', 'CPP', 'https://corpus927.enfam.jus.br/legislacao/cpp-41'),
('cc-02', 'Código Civil', 'CC', 'https://corpus927.enfam.jus.br/legislacao/cc-02'),
('cpc-15', 'Código de Processo Civil', 'CPC', 'https://corpus927.enfam.jus.br/legislacao/cpc-15'),
('ctn-66', 'Código Tributário Nacional', 'CTN', 'https://corpus927.enfam.jus.br/legislacao/ctn-66'),
('cdc-90', 'Código de Defesa do Consumidor', 'CDC', 'https://corpus927.enfam.jus.br/legislacao/cdc-90'),
('CLT-43', 'Consolidação das Leis do Trabalho', 'CLT', 'https://corpus927.enfam.jus.br/legislacao/CLT-43'),
('eca-90', 'Estatuto da Criança e do Adolescente', 'ECA', 'https://corpus927.enfam.jus.br/legislacao/eca-90'),
('cf-88', 'Constituição Federal', 'CF', 'https://corpus927.enfam.jus.br/legislacao/cf-88'),
('lep-84', 'Lei de Execução Penal', 'LEP', 'https://corpus927.enfam.jus.br/legislacao/lep-84');

-- Tabela de cache de jurisprudências
CREATE TABLE public.jurisprudencias_corpus927 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  legislacao TEXT NOT NULL REFERENCES public.legislacoes_corpus927(codigo),
  artigo TEXT NOT NULL,
  texto_artigo TEXT,
  jurisprudencias JSONB DEFAULT '[]'::jsonb,
  url_fonte TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(legislacao, artigo)
);

-- Habilitar RLS
ALTER TABLE public.jurisprudencias_corpus927 ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública
CREATE POLICY "Jurisprudências são públicas para leitura"
ON public.jurisprudencias_corpus927
FOR SELECT
USING (true);

-- Política para inserção (via service role)
CREATE POLICY "Service role pode inserir jurisprudências"
ON public.jurisprudencias_corpus927
FOR INSERT
WITH CHECK (true);

-- Política para atualização (via service role)
CREATE POLICY "Service role pode atualizar jurisprudências"
ON public.jurisprudencias_corpus927
FOR UPDATE
USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_jurisprudencias_corpus927_updated_at
BEFORE UPDATE ON public.jurisprudencias_corpus927
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_jurisprudencias_legislacao ON public.jurisprudencias_corpus927(legislacao);
CREATE INDEX idx_jurisprudencias_artigo ON public.jurisprudencias_corpus927(artigo);
CREATE INDEX idx_jurisprudencias_updated ON public.jurisprudencias_corpus927(updated_at DESC);