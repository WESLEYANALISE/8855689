-- Sprint 1: Adicionar coluna termos_aprofundados em todas as tabelas de códigos

-- Código Penal
ALTER TABLE public."CP - Código Penal"
ADD COLUMN IF NOT EXISTS termos_aprofundados JSONB DEFAULT '{}'::jsonb;

-- Código Civil
ALTER TABLE public."CC - Código Civil"
ADD COLUMN IF NOT EXISTS termos_aprofundados JSONB DEFAULT '{}'::jsonb;

-- Constituição Federal
ALTER TABLE public."CF - Constituição Federal"
ADD COLUMN IF NOT EXISTS termos_aprofundados JSONB DEFAULT '{}'::jsonb;

-- Código de Processo Civil
ALTER TABLE public."CPC – Código de Processo Civil"
ADD COLUMN IF NOT EXISTS termos_aprofundados JSONB DEFAULT '{}'::jsonb;

-- Código de Processo Penal
ALTER TABLE public."CPP – Código de Processo Penal"
ADD COLUMN IF NOT EXISTS termos_aprofundados JSONB DEFAULT '{}'::jsonb;

-- Código de Defesa do Consumidor
ALTER TABLE public."CDC – Código de Defesa do Consumidor"
ADD COLUMN IF NOT EXISTS termos_aprofundados JSONB DEFAULT '{}'::jsonb;

-- Consolidação das Leis do Trabalho
ALTER TABLE public."CLT – Consolidação das Leis do Trabalho"
ADD COLUMN IF NOT EXISTS termos_aprofundados JSONB DEFAULT '{}'::jsonb;

-- Código Tributário Nacional
ALTER TABLE public."CTN – Código Tributário Nacional"
ADD COLUMN IF NOT EXISTS termos_aprofundados JSONB DEFAULT '{}'::jsonb;

-- Código de Trânsito Brasileiro
ALTER TABLE public."CTB Código de Trânsito Brasileiro"
ADD COLUMN IF NOT EXISTS termos_aprofundados JSONB DEFAULT '{}'::jsonb;

-- Código Eleitoral
ALTER TABLE public."CE – Código Eleitoral"
ADD COLUMN IF NOT EXISTS termos_aprofundados JSONB DEFAULT '{}'::jsonb;

-- Código de Águas
ALTER TABLE public."CA - Código de Águas"
ADD COLUMN IF NOT EXISTS termos_aprofundados JSONB DEFAULT '{}'::jsonb;

-- Código Brasileiro de Aeronáutica
ALTER TABLE public."CBA Código Brasileiro de Aeronáutica"
ADD COLUMN IF NOT EXISTS termos_aprofundados JSONB DEFAULT '{}'::jsonb;

-- Código Comercial
ALTER TABLE public."CCOM – Código Comercial"
ADD COLUMN IF NOT EXISTS termos_aprofundados JSONB DEFAULT '{}'::jsonb;

-- Código de Minas
ALTER TABLE public."CDM – Código de Minas"
ADD COLUMN IF NOT EXISTS termos_aprofundados JSONB DEFAULT '{}'::jsonb;

-- Estatuto da Criança e do Adolescente
ALTER TABLE public."ESTATUTO - ECA"
ADD COLUMN IF NOT EXISTS termos_aprofundados JSONB DEFAULT '{}'::jsonb;

-- Estatuto do Idoso
ALTER TABLE public."ESTATUTO - IDOSO"
ADD COLUMN IF NOT EXISTS termos_aprofundados JSONB DEFAULT '{}'::jsonb;

-- Estatuto da OAB
ALTER TABLE public."ESTATUTO - OAB"
ADD COLUMN IF NOT EXISTS termos_aprofundados JSONB DEFAULT '{}'::jsonb;

-- Estatuto da Pessoa com Deficiência
ALTER TABLE public."ESTATUTO - PESSOA COM DEFICIÊNCIA"
ADD COLUMN IF NOT EXISTS termos_aprofundados JSONB DEFAULT '{}'::jsonb;

-- Estatuto da Igualdade Racial
ALTER TABLE public."ESTATUTO - IGUALDADE RACIAL"
ADD COLUMN IF NOT EXISTS termos_aprofundados JSONB DEFAULT '{}'::jsonb;

-- Estatuto da Cidade
ALTER TABLE public."ESTATUTO - CIDADE"
ADD COLUMN IF NOT EXISTS termos_aprofundados JSONB DEFAULT '{}'::jsonb;

-- Estatuto do Torcedor
ALTER TABLE public."ESTATUTO - TORCEDOR"
ADD COLUMN IF NOT EXISTS termos_aprofundados JSONB DEFAULT '{}'::jsonb;

-- Adicionar comentários para documentação
COMMENT ON COLUMN public."CP - Código Penal".termos_aprofundados IS 'Armazena aprofundamentos de termos jurídicos no formato: {"termo1": {"termo": "nome", "pontos": [...]}, "termo2": {...}}';

-- Criar índice GIN para melhorar performance de queries em JSONB
CREATE INDEX IF NOT EXISTS idx_cp_termos_aprofundados ON public."CP - Código Penal" USING GIN (termos_aprofundados);
CREATE INDEX IF NOT EXISTS idx_cc_termos_aprofundados ON public."CC - Código Civil" USING GIN (termos_aprofundados);
CREATE INDEX IF NOT EXISTS idx_cf_termos_aprofundados ON public."CF - Constituição Federal" USING GIN (termos_aprofundados);
CREATE INDEX IF NOT EXISTS idx_cpc_termos_aprofundados ON public."CPC – Código de Processo Civil" USING GIN (termos_aprofundados);
CREATE INDEX IF NOT EXISTS idx_cpp_termos_aprofundados ON public."CPP – Código de Processo Penal" USING GIN (termos_aprofundados);
CREATE INDEX IF NOT EXISTS idx_cdc_termos_aprofundados ON public."CDC – Código de Defesa do Consumidor" USING GIN (termos_aprofundados);
CREATE INDEX IF NOT EXISTS idx_clt_termos_aprofundados ON public."CLT – Consolidação das Leis do Trabalho" USING GIN (termos_aprofundados);
CREATE INDEX IF NOT EXISTS idx_ctn_termos_aprofundados ON public."CTN – Código Tributário Nacional" USING GIN (termos_aprofundados);
CREATE INDEX IF NOT EXISTS idx_ctb_termos_aprofundados ON public."CTB Código de Trânsito Brasileiro" USING GIN (termos_aprofundados);
CREATE INDEX IF NOT EXISTS idx_ce_termos_aprofundados ON public."CE – Código Eleitoral" USING GIN (termos_aprofundados);
CREATE INDEX IF NOT EXISTS idx_ca_termos_aprofundados ON public."CA - Código de Águas" USING GIN (termos_aprofundados);
CREATE INDEX IF NOT EXISTS idx_cba_termos_aprofundados ON public."CBA Código Brasileiro de Aeronáutica" USING GIN (termos_aprofundados);
CREATE INDEX IF NOT EXISTS idx_ccom_termos_aprofundados ON public."CCOM – Código Comercial" USING GIN (termos_aprofundados);
CREATE INDEX IF NOT EXISTS idx_cdm_termos_aprofundados ON public."CDM – Código de Minas" USING GIN (termos_aprofundados);
CREATE INDEX IF NOT EXISTS idx_eca_termos_aprofundados ON public."ESTATUTO - ECA" USING GIN (termos_aprofundados);
CREATE INDEX IF NOT EXISTS idx_idoso_termos_aprofundados ON public."ESTATUTO - IDOSO" USING GIN (termos_aprofundados);
CREATE INDEX IF NOT EXISTS idx_oab_termos_aprofundados ON public."ESTATUTO - OAB" USING GIN (termos_aprofundados);
CREATE INDEX IF NOT EXISTS idx_pcd_termos_aprofundados ON public."ESTATUTO - PESSOA COM DEFICIÊNCIA" USING GIN (termos_aprofundados);
CREATE INDEX IF NOT EXISTS idx_racial_termos_aprofundados ON public."ESTATUTO - IGUALDADE RACIAL" USING GIN (termos_aprofundados);
CREATE INDEX IF NOT EXISTS idx_cidade_termos_aprofundados ON public."ESTATUTO - CIDADE" USING GIN (termos_aprofundados);
CREATE INDEX IF NOT EXISTS idx_torcedor_termos_aprofundados ON public."ESTATUTO - TORCEDOR" USING GIN (termos_aprofundados);