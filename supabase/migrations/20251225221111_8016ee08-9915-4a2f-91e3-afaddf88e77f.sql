-- Tabela para controle de monitoramento de cada lei
CREATE TABLE IF NOT EXISTS public.monitoramento_leis (
  id SERIAL PRIMARY KEY,
  tabela_lei TEXT NOT NULL UNIQUE,
  url_planalto TEXT NOT NULL,
  nome_amigavel TEXT,
  ultima_verificacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ultimo_hash TEXT,
  ultimo_total_artigos INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'atualizado', 'com_alteracoes', 'erro', 'verificando')),
  erro_detalhes TEXT,
  alteracoes_detectadas INTEGER DEFAULT 0,
  ultima_alteracao_detectada TIMESTAMP WITH TIME ZONE,
  ativo BOOLEAN DEFAULT true,
  prioridade INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_monitoramento_leis_status ON public.monitoramento_leis(status);
CREATE INDEX IF NOT EXISTS idx_monitoramento_leis_ativo ON public.monitoramento_leis(ativo);
CREATE INDEX IF NOT EXISTS idx_monitoramento_leis_ultima_verificacao ON public.monitoramento_leis(ultima_verificacao);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_monitoramento_leis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_monitoramento_leis_updated_at
  BEFORE UPDATE ON public.monitoramento_leis
  FOR EACH ROW
  EXECUTE FUNCTION public.update_monitoramento_leis_updated_at();

-- Tabela para log de execuções do monitoramento
CREATE TABLE IF NOT EXISTS public.monitoramento_execucoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inicio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fim TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'executando' CHECK (status IN ('executando', 'concluido', 'erro', 'cancelado')),
  leis_verificadas INTEGER DEFAULT 0,
  alteracoes_encontradas INTEGER DEFAULT 0,
  erros INTEGER DEFAULT 0,
  detalhes JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.monitoramento_leis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoramento_execucoes ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público para leitura
CREATE POLICY "Monitoramento leis visível para todos"
  ON public.monitoramento_leis FOR SELECT
  USING (true);

CREATE POLICY "Execuções visíveis para todos"
  ON public.monitoramento_execucoes FOR SELECT
  USING (true);

-- Políticas para insert/update (via service role das edge functions)
CREATE POLICY "Service role pode inserir monitoramento"
  ON public.monitoramento_leis FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role pode atualizar monitoramento"
  ON public.monitoramento_leis FOR UPDATE
  USING (true);

CREATE POLICY "Service role pode inserir execuções"
  ON public.monitoramento_execucoes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role pode atualizar execuções"
  ON public.monitoramento_execucoes FOR UPDATE
  USING (true);

-- Popular tabela com leis existentes do mapeamento
INSERT INTO public.monitoramento_leis (tabela_lei, url_planalto, nome_amigavel, prioridade) VALUES
  ('CF - Constituição Federal', 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicaocompilado.htm', 'Constituição Federal', 1),
  ('CC - Código Civil', 'https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm', 'Código Civil', 2),
  ('CP - Código Penal', 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del2848compilado.htm', 'Código Penal', 1),
  ('CPC – Código de Processo Civil', 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105.htm', 'CPC', 2),
  ('CPP – Código de Processo Penal', 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del3689compilado.htm', 'CPP', 2),
  ('CLT - Consolidação das Leis do Trabalho', 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452compilado.htm', 'CLT', 2),
  ('CTN – Código Tributário Nacional', 'https://www.planalto.gov.br/ccivil_03/leis/l5172compilado.htm', 'CTN', 3),
  ('CDC – Código de Defesa do Consumidor', 'https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm', 'CDC', 2),
  ('CE – Código Eleitoral', 'https://www.planalto.gov.br/ccivil_03/leis/l4737compilado.htm', 'Código Eleitoral', 3),
  ('CTB Código de Trânsito Brasileiro', 'https://www.planalto.gov.br/ccivil_03/leis/l9503compilado.htm', 'CTB', 3),
  ('CPM – Código Penal Militar', 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del1001compilado.htm', 'CPM', 4),
  ('CPPM – Código de Processo Penal Militar', 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del1002compilado.htm', 'CPPM', 4),
  ('ESTATUTO - ECA', 'https://www.planalto.gov.br/ccivil_03/leis/l8069compilado.htm', 'ECA', 2),
  ('ESTATUTO - OAB', 'https://www.planalto.gov.br/ccivil_03/leis/l8906compilado.htm', 'Estatuto OAB', 3),
  ('ESTATUTO - IDOSO', 'https://www.planalto.gov.br/ccivil_03/leis/2003/l10.741compilado.htm', 'Estatuto do Idoso', 3),
  ('ESTATUTO - PESSOA COM DEFICIÊNCIA', 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13146.htm', 'Estatuto PCD', 3),
  ('Lei 11.340 de 2006 - Maria da Penha', 'https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2006/lei/l11340.htm', 'Maria da Penha', 2),
  ('Lei 11.343 de 2006 - Lei de Drogas', 'https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2006/lei/l11343compilado.htm', 'Lei de Drogas', 2),
  ('Lei 12.850 de 2013 - Organizações Criminosas', 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/lei/l12850.htm', 'Organizações Criminosas', 3),
  ('Lei 7.210 de 1984 - Lei de Execução Penal', 'https://www.planalto.gov.br/ccivil_03/leis/l7210compilado.htm', 'LEP', 2),
  ('Lei 8.072 de 1990 - Crimes Hediondos', 'https://www.planalto.gov.br/ccivil_03/leis/L8072compilada.htm', 'Crimes Hediondos', 2),
  ('Lei 9.099 de 1995 - Juizados Especiais', 'https://www.planalto.gov.br/ccivil_03/leis/l9099compilado.htm', 'Juizados Especiais', 3)
ON CONFLICT (tabela_lei) DO NOTHING;