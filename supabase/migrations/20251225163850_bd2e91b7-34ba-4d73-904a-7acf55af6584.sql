-- Tabela para armazenar a nota final unificada de cada político
CREATE TABLE public.ranking_nota_final (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  politico_id INTEGER NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('deputado', 'senador')),
  nome TEXT NOT NULL,
  partido TEXT,
  uf TEXT,
  foto_url TEXT,
  
  -- Notas individuais (0-10)
  nota_votacoes NUMERIC(4,2) DEFAULT 0,
  nota_gastos NUMERIC(4,2) DEFAULT 0,
  nota_presenca NUMERIC(4,2) DEFAULT 0,
  nota_proposicoes NUMERIC(4,2) DEFAULT 0,
  nota_processos NUMERIC(4,2) DEFAULT 10, -- Começa em 10, subtrai se tiver processos
  nota_outros NUMERIC(4,2) DEFAULT 0,
  
  -- Nota final calculada
  nota_final NUMERIC(4,2) NOT NULL DEFAULT 0,
  
  -- Posição no ranking
  posicao INTEGER,
  posicao_anterior INTEGER,
  variacao_posicao INTEGER DEFAULT 0,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraint única para evitar duplicatas
  CONSTRAINT unique_politico_ranking UNIQUE (politico_id, tipo)
);

-- Índices para performance
CREATE INDEX idx_ranking_nota_final ON ranking_nota_final(nota_final DESC);
CREATE INDEX idx_ranking_tipo ON ranking_nota_final(tipo);
CREATE INDEX idx_ranking_uf ON ranking_nota_final(uf);
CREATE INDEX idx_ranking_partido ON ranking_nota_final(partido);
CREATE INDEX idx_ranking_posicao ON ranking_nota_final(posicao);

-- Tabela para armazenar processos judiciais dos políticos
CREATE TABLE public.processos_politicos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  politico_id INTEGER NOT NULL,
  tipo_politico TEXT NOT NULL CHECK (tipo_politico IN ('deputado', 'senador')),
  
  -- Dados do processo
  numero_processo TEXT,
  tipo_processo TEXT, -- 'criminal', 'eleitoral', 'administrativo', 'civil'
  tribunal TEXT, -- 'TSE', 'STF', 'STJ', 'TRF', etc.
  status TEXT, -- 'em_andamento', 'arquivado', 'condenado', 'absolvido'
  descricao TEXT,
  
  -- Datas
  data_inicio DATE,
  data_atualizacao DATE,
  
  -- Impacto na nota
  impacto_nota NUMERIC(4,2) DEFAULT 0, -- Quanto subtrai da nota
  
  -- Fontes
  link_fonte TEXT,
  fonte_raspagem TEXT,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraint única
  CONSTRAINT unique_processo UNIQUE (politico_id, tipo_politico, numero_processo)
);

-- Índices
CREATE INDEX idx_processos_politico ON processos_politicos(politico_id, tipo_politico);
CREATE INDEX idx_processos_status ON processos_politicos(status);
CREATE INDEX idx_processos_tribunal ON processos_politicos(tribunal);

-- Tabela para histórico de votações analisadas
CREATE TABLE public.votacoes_analisadas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  politico_id INTEGER NOT NULL,
  tipo_politico TEXT NOT NULL CHECK (tipo_politico IN ('deputado', 'senador')),
  
  -- Dados da votação
  votacao_id TEXT NOT NULL,
  data_votacao DATE,
  proposicao TEXT,
  tema TEXT, -- 'economia', 'social', 'ambiental', 'seguranca', etc.
  
  -- Voto do político
  voto TEXT, -- 'sim', 'nao', 'abstencao', 'ausente'
  voto_esperado TEXT, -- Qual seria o voto ideal segundo critérios objetivos
  
  -- Pontuação
  pontos NUMERIC(4,2) DEFAULT 0, -- Positivo se votou bem, negativo se votou mal
  justificativa TEXT,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_voto_politico UNIQUE (politico_id, tipo_politico, votacao_id)
);

-- Índices
CREATE INDEX idx_votacoes_politico ON votacoes_analisadas(politico_id, tipo_politico);
CREATE INDEX idx_votacoes_tema ON votacoes_analisadas(tema);
CREATE INDEX idx_votacoes_data ON votacoes_analisadas(data_votacao DESC);

-- Enable RLS
ALTER TABLE public.ranking_nota_final ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processos_politicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votacoes_analisadas ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura pública (dados são públicos)
CREATE POLICY "Ranking é público para leitura" ON public.ranking_nota_final
  FOR SELECT USING (true);

CREATE POLICY "Processos são públicos para leitura" ON public.processos_politicos
  FOR SELECT USING (true);

CREATE POLICY "Votações são públicas para leitura" ON public.votacoes_analisadas
  FOR SELECT USING (true);

-- Políticas de escrita apenas para service role (via Edge Functions)
CREATE POLICY "Apenas service role pode inserir ranking" ON public.ranking_nota_final
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Apenas service role pode atualizar ranking" ON public.ranking_nota_final
  FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "Apenas service role pode inserir processos" ON public.processos_politicos
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Apenas service role pode atualizar processos" ON public.processos_politicos
  FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "Apenas service role pode inserir votações" ON public.votacoes_analisadas
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Trigger para atualizar updated_at
CREATE TRIGGER update_ranking_nota_final_updated_at
  BEFORE UPDATE ON public.ranking_nota_final
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_processos_politicos_updated_at
  BEFORE UPDATE ON public.processos_politicos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();