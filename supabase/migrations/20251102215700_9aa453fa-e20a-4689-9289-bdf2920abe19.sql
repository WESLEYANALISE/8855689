-- Criar tabela de Súmulas do TST (Tribunal Superior do Trabalho)
CREATE TABLE IF NOT EXISTS public."SUMULAS TST" (
  id bigint PRIMARY KEY,
  "Título da Súmula" text,
  "Texto da Súmula" text,
  "Narração" text,
  "Data de Aprovação" text,
  visualizacoes integer DEFAULT 0,
  ultima_visualizacao timestamp with time zone,
  versao_conteudo integer DEFAULT 1,
  termos jsonb DEFAULT NULL,
  flashcards jsonb DEFAULT NULL,
  questoes jsonb DEFAULT NULL,
  ultima_atualizacao timestamp without time zone
);

-- Criar tabela de Súmulas do TSE (Tribunal Superior Eleitoral)
CREATE TABLE IF NOT EXISTS public."SUMULAS TSE" (
  id bigint PRIMARY KEY,
  "Título da Súmula" text,
  "Texto da Súmula" text,
  "Narração" text,
  "Data de Aprovação" text,
  visualizacoes integer DEFAULT 0,
  ultima_visualizacao timestamp with time zone,
  versao_conteudo integer DEFAULT 1,
  termos jsonb DEFAULT NULL,
  flashcards jsonb DEFAULT NULL,
  questoes jsonb DEFAULT NULL,
  ultima_atualizacao timestamp without time zone
);

-- Criar tabela de Súmulas do STM (Superior Tribunal Militar)
CREATE TABLE IF NOT EXISTS public."SUMULAS STM" (
  id bigint PRIMARY KEY,
  "Título da Súmula" text,
  "Texto da Súmula" text,
  "Narração" text,
  "Data de Aprovação" text,
  visualizacoes integer DEFAULT 0,
  ultima_visualizacao timestamp with time zone,
  versao_conteudo integer DEFAULT 1,
  termos jsonb DEFAULT NULL,
  flashcards jsonb DEFAULT NULL,
  questoes jsonb DEFAULT NULL,
  ultima_atualizacao timestamp without time zone
);

-- Criar tabela de Súmulas do TCU (Tribunal de Contas da União)
CREATE TABLE IF NOT EXISTS public."SUMULAS TCU" (
  id bigint PRIMARY KEY,
  "Título da Súmula" text,
  "Texto da Súmula" text,
  "Narração" text,
  "Data de Aprovação" text,
  visualizacoes integer DEFAULT 0,
  ultima_visualizacao timestamp with time zone,
  versao_conteudo integer DEFAULT 1,
  termos jsonb DEFAULT NULL,
  flashcards jsonb DEFAULT NULL,
  questoes jsonb DEFAULT NULL,
  ultima_atualizacao timestamp without time zone
);

-- Criar tabela de Enunciados do CNMP (Conselho Nacional do Ministério Público)
CREATE TABLE IF NOT EXISTS public."ENUNCIADOS CNMP" (
  id bigint PRIMARY KEY,
  "Título da Súmula" text,
  "Texto da Súmula" text,
  "Narração" text,
  "Data de Aprovação" text,
  visualizacoes integer DEFAULT 0,
  ultima_visualizacao timestamp with time zone,
  versao_conteudo integer DEFAULT 1,
  termos jsonb DEFAULT NULL,
  flashcards jsonb DEFAULT NULL,
  questoes jsonb DEFAULT NULL,
  ultima_atualizacao timestamp without time zone
);

-- Criar tabela de Enunciados do CNJ (Conselho Nacional de Justiça)
CREATE TABLE IF NOT EXISTS public."ENUNCIADOS CNJ" (
  id bigint PRIMARY KEY,
  "Título da Súmula" text,
  "Texto da Súmula" text,
  "Narração" text,
  "Data de Aprovação" text,
  visualizacoes integer DEFAULT 0,
  ultima_visualizacao timestamp with time zone,
  versao_conteudo integer DEFAULT 1,
  termos jsonb DEFAULT NULL,
  flashcards jsonb DEFAULT NULL,
  questoes jsonb DEFAULT NULL,
  ultima_atualizacao timestamp without time zone
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public."SUMULAS TST" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SUMULAS TSE" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SUMULAS STM" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SUMULAS TCU" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ENUNCIADOS CNMP" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ENUNCIADOS CNJ" ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso público para leitura
CREATE POLICY "Súmulas TST são públicas" ON public."SUMULAS TST" FOR SELECT USING (true);
CREATE POLICY "Súmulas TSE são públicas" ON public."SUMULAS TSE" FOR SELECT USING (true);
CREATE POLICY "Súmulas STM são públicas" ON public."SUMULAS STM" FOR SELECT USING (true);
CREATE POLICY "Súmulas TCU são públicas" ON public."SUMULAS TCU" FOR SELECT USING (true);
CREATE POLICY "Enunciados CNMP são públicos" ON public."ENUNCIADOS CNMP" FOR SELECT USING (true);
CREATE POLICY "Enunciados CNJ são públicos" ON public."ENUNCIADOS CNJ" FOR SELECT USING (true);

-- Criar políticas para atualização pelo sistema
CREATE POLICY "Sistema pode atualizar TST" ON public."SUMULAS TST" FOR UPDATE USING (true);
CREATE POLICY "Sistema pode atualizar TSE" ON public."SUMULAS TSE" FOR UPDATE USING (true);
CREATE POLICY "Sistema pode atualizar STM" ON public."SUMULAS STM" FOR UPDATE USING (true);
CREATE POLICY "Sistema pode atualizar TCU" ON public."SUMULAS TCU" FOR UPDATE USING (true);
CREATE POLICY "Sistema pode atualizar CNMP" ON public."ENUNCIADOS CNMP" FOR UPDATE USING (true);
CREATE POLICY "Sistema pode atualizar CNJ" ON public."ENUNCIADOS CNJ" FOR UPDATE USING (true);