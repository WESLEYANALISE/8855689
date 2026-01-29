-- Criar tabela de Súmulas do STJ separada
CREATE TABLE IF NOT EXISTS public."SUMULAS STJ" (
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

-- Renomear tabela SUMULAS para SUMULAS STF
ALTER TABLE public."SUMULAS" RENAME TO "SUMULAS STF";

-- Habilitar RLS
ALTER TABLE public."SUMULAS STJ" ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso público
CREATE POLICY "Súmulas STJ são públicas" ON public."SUMULAS STJ" FOR SELECT USING (true);
CREATE POLICY "Sistema pode atualizar STJ" ON public."SUMULAS STJ" FOR UPDATE USING (true);