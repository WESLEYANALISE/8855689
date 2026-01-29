-- Adicionar colunas de tracking de visualizações em todas as tabelas de códigos

-- Código Penal
ALTER TABLE "CP - Código Penal" 
ADD COLUMN IF NOT EXISTS visualizacoes integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS ultima_visualizacao timestamp with time zone DEFAULT NULL;

-- Código Civil  
ALTER TABLE "CC - Código Civil"
ADD COLUMN IF NOT EXISTS visualizacoes integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS ultima_visualizacao timestamp with time zone DEFAULT NULL;

-- Código de Processo Civil
ALTER TABLE "CPC – Código de Processo Civil"
ADD COLUMN IF NOT EXISTS visualizacoes integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS ultima_visualizacao timestamp with time zone DEFAULT NULL;

-- Código de Processo Penal
ALTER TABLE "CPP – Código de Processo Penal"
ADD COLUMN IF NOT EXISTS visualizacoes integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS ultima_visualizacao timestamp with time zone DEFAULT NULL;

-- Constituição Federal
ALTER TABLE "CF - Constituição Federal"
ADD COLUMN IF NOT EXISTS visualizacoes integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS ultima_visualizacao timestamp with time zone DEFAULT NULL;

-- CLT
ALTER TABLE "CLT – Consolidação das Leis do Trabalho"
ADD COLUMN IF NOT EXISTS visualizacoes integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS ultima_visualizacao timestamp with time zone DEFAULT NULL;

-- CDC
ALTER TABLE "CDC – Código de Defesa do Consumidor"
ADD COLUMN IF NOT EXISTS visualizacoes integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS ultima_visualizacao timestamp with time zone DEFAULT NULL;

-- CTN
ALTER TABLE "CTN – Código Tributário Nacional"
ADD COLUMN IF NOT EXISTS visualizacoes integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS ultima_visualizacao timestamp with time zone DEFAULT NULL;

-- CTB
ALTER TABLE "CTB Código de Trânsito Brasileiro"
ADD COLUMN IF NOT EXISTS visualizacoes integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS ultima_visualizacao timestamp with time zone DEFAULT NULL;

-- Código Eleitoral
ALTER TABLE "CE – Código Eleitoral"
ADD COLUMN IF NOT EXISTS visualizacoes integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS ultima_visualizacao timestamp with time zone DEFAULT NULL;

-- Código de Águas
ALTER TABLE "CA - Código de Águas"
ADD COLUMN IF NOT EXISTS visualizacoes integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS ultima_visualizacao timestamp with time zone DEFAULT NULL;

-- CBA
ALTER TABLE "CBA Código Brasileiro de Aeronáutica"
ADD COLUMN IF NOT EXISTS visualizacoes integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS ultima_visualizacao timestamp with time zone DEFAULT NULL;

-- CBT
ALTER TABLE "CBT Código Brasileiro de Telecomunicações"
ADD COLUMN IF NOT EXISTS visualizacoes integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS ultima_visualizacao timestamp with time zone DEFAULT NULL;

-- Código Comercial
ALTER TABLE "CCOM – Código Comercial"
ADD COLUMN IF NOT EXISTS visualizacoes integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS ultima_visualizacao timestamp with time zone DEFAULT NULL;

-- Código de Minas
ALTER TABLE "CDM – Código de Minas"
ADD COLUMN IF NOT EXISTS visualizacoes integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS ultima_visualizacao timestamp with time zone DEFAULT NULL;

-- Estatutos
ALTER TABLE "ESTATUTO - CIDADE"
ADD COLUMN IF NOT EXISTS visualizacoes integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS ultima_visualizacao timestamp with time zone DEFAULT NULL;

ALTER TABLE "ESTATUTO - DESARMAMENTO"
ADD COLUMN IF NOT EXISTS visualizacoes integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS ultima_visualizacao timestamp with time zone DEFAULT NULL;

ALTER TABLE "ESTATUTO - ECA"
ADD COLUMN IF NOT EXISTS visualizacoes integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS ultima_visualizacao timestamp with time zone DEFAULT NULL;

ALTER TABLE "ESTATUTO - IDOSO"
ADD COLUMN IF NOT EXISTS visualizacoes integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS ultima_visualizacao timestamp with time zone DEFAULT NULL;

ALTER TABLE "ESTATUTO - IGUALDADE RACIAL"
ADD COLUMN IF NOT EXISTS visualizacoes integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS ultima_visualizacao timestamp with time zone DEFAULT NULL;

ALTER TABLE "ESTATUTO - OAB"
ADD COLUMN IF NOT EXISTS visualizacoes integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS ultima_visualizacao timestamp with time zone DEFAULT NULL;

ALTER TABLE "ESTATUTO - PESSOA COM DEFICIÊNCIA"
ADD COLUMN IF NOT EXISTS visualizacoes integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS ultima_visualizacao timestamp with time zone DEFAULT NULL;

ALTER TABLE "ESTATUTO - TORCEDOR"
ADD COLUMN IF NOT EXISTS visualizacoes integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS ultima_visualizacao timestamp with time zone DEFAULT NULL;

-- Criar índices para melhorar performance das queries de ranking
CREATE INDEX IF NOT EXISTS idx_cp_visualizacoes ON "CP - Código Penal" (visualizacoes DESC);
CREATE INDEX IF NOT EXISTS idx_cc_visualizacoes ON "CC - Código Civil" (visualizacoes DESC);
CREATE INDEX IF NOT EXISTS idx_cpc_visualizacoes ON "CPC – Código de Processo Civil" (visualizacoes DESC);
CREATE INDEX IF NOT EXISTS idx_cpp_visualizacoes ON "CPP – Código de Processo Penal" (visualizacoes DESC);
CREATE INDEX IF NOT EXISTS idx_cf_visualizacoes ON "CF - Constituição Federal" (visualizacoes DESC);
CREATE INDEX IF NOT EXISTS idx_clt_visualizacoes ON "CLT – Consolidação das Leis do Trabalho" (visualizacoes DESC);
CREATE INDEX IF NOT EXISTS idx_cdc_visualizacoes ON "CDC – Código de Defesa do Consumidor" (visualizacoes DESC);
CREATE INDEX IF NOT EXISTS idx_ctn_visualizacoes ON "CTN – Código Tributário Nacional" (visualizacoes DESC);
CREATE INDEX IF NOT EXISTS idx_ctb_visualizacoes ON "CTB Código de Trânsito Brasileiro" (visualizacoes DESC);
CREATE INDEX IF NOT EXISTS idx_ce_visualizacoes ON "CE – Código Eleitoral" (visualizacoes DESC);