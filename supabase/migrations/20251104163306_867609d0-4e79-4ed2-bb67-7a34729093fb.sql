-- Tabela principal de questões geradas
CREATE TABLE IF NOT EXISTS "QUESTOES_GERADAS" (
  id bigserial PRIMARY KEY,
  
  -- Origem do conteúdo
  area text NOT NULL,
  tema text NOT NULL,
  subtema text,
  
  -- Dados da questão
  enunciado text NOT NULL,
  alternativa_a text NOT NULL,
  alternativa_b text NOT NULL,
  alternativa_c text NOT NULL,
  alternativa_d text NOT NULL,
  resposta_correta text NOT NULL CHECK (resposta_correta IN ('A', 'B', 'C', 'D')),
  
  -- Comentário explicativo
  comentario text NOT NULL,
  
  -- Metadados de geração
  gerada_em timestamp with time zone DEFAULT now(),
  modelo_ia text DEFAULT 'gemini-2.0-flash',
  versao_geracao integer DEFAULT 1,
  
  -- Analytics
  vezes_respondida integer DEFAULT 0,
  acertos integer DEFAULT 0,
  erros integer DEFAULT 0,
  taxa_acerto numeric GENERATED ALWAYS AS (
    CASE 
      WHEN vezes_respondida > 0 THEN (acertos::numeric / vezes_respondida::numeric) * 100
      ELSE 0
    END
  ) STORED,
  
  -- Controle de qualidade
  aprovada boolean DEFAULT true,
  reportada integer DEFAULT 0,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_questoes_area ON "QUESTOES_GERADAS"(area);
CREATE INDEX idx_questoes_tema ON "QUESTOES_GERADAS"(tema);
CREATE INDEX idx_questoes_taxa_acerto ON "QUESTOES_GERADAS"(taxa_acerto DESC);
CREATE INDEX idx_questoes_aprovada ON "QUESTOES_GERADAS"(aprovada) WHERE aprovada = true;

-- RLS Policies
ALTER TABLE "QUESTOES_GERADAS" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Questões são públicas para leitura"
ON "QUESTOES_GERADAS" FOR SELECT
USING (aprovada = true);

CREATE POLICY "Sistema pode gerenciar questões"
ON "QUESTOES_GERADAS" FOR ALL
USING (true)
WITH CHECK (true);

-- Tabela de controle de geração em lote
CREATE TABLE IF NOT EXISTS "QUESTOES_LOTE" (
  id bigserial PRIMARY KEY,
  
  -- Configuração do lote
  areas_selecionadas text[] NOT NULL,
  questoes_por_tema integer DEFAULT 3,
  total_questoes_geradas integer DEFAULT 0,
  total_resumos_processados integer DEFAULT 0,
  
  -- Status
  status text DEFAULT 'pendente' CHECK (status IN ('pendente', 'processando', 'concluido', 'erro')),
  progresso_percentual numeric DEFAULT 0,
  
  -- Logs
  iniciado_em timestamp with time zone,
  concluido_em timestamp with time zone,
  tempo_total_minutos numeric,
  log_erros jsonb DEFAULT '[]'::jsonb,
  
  -- Custo estimado
  tokens_gastos integer DEFAULT 0,
  custo_estimado_usd numeric DEFAULT 0,
  
  created_at timestamp with time zone DEFAULT now()
);

-- RLS Policies para lote
ALTER TABLE "QUESTOES_LOTE" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lotes são públicos para leitura"
ON "QUESTOES_LOTE" FOR SELECT
USING (true);

CREATE POLICY "Sistema pode gerenciar lotes"
ON "QUESTOES_LOTE" FOR ALL
USING (true)
WITH CHECK (true);

-- Função para incrementar estatísticas de questão
CREATE OR REPLACE FUNCTION incrementar_stats_questao(
  p_questao_id bigint,
  p_correta boolean
)
RETURNS void AS $$
BEGIN
  UPDATE "QUESTOES_GERADAS"
  SET 
    vezes_respondida = vezes_respondida + 1,
    acertos = acertos + CASE WHEN p_correta THEN 1 ELSE 0 END,
    erros = erros + CASE WHEN p_correta THEN 0 ELSE 1 END,
    updated_at = now()
  WHERE id = p_questao_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;