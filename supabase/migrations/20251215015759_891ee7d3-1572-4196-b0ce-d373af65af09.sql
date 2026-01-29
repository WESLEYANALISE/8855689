
-- =====================================================
-- CÓDIGOS (5 tabelas)
-- =====================================================

-- CF - Código Florestal
CREATE TABLE IF NOT EXISTS public."CF - Código Florestal" (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "Número do Artigo" text,
  "Artigo" text,
  exemplo text,
  explicacao_simples_maior16 text,
  explicacao_simples_menor16 text,
  explicacao_resumido text,
  explicacao_tecnico text,
  "Aula" text,
  "Comentario" text,
  "Narração" text,
  termos jsonb,
  flashcards jsonb,
  questoes jsonb,
  versao_conteudo integer DEFAULT 1,
  ultima_atualizacao timestamp without time zone,
  termos_aprofundados jsonb DEFAULT '{}'::jsonb,
  visualizacoes integer DEFAULT 0,
  ultima_visualizacao timestamp with time zone
);
ALTER TABLE public."CF - Código Florestal" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Público para leitura" ON public."CF - Código Florestal" FOR SELECT USING (true);
CREATE POLICY "Sistema pode atualizar" ON public."CF - Código Florestal" FOR UPDATE USING (true);

-- CC - Código de Caça
CREATE TABLE IF NOT EXISTS public."CC - Código de Caça" (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "Número do Artigo" text,
  "Artigo" text,
  exemplo text,
  explicacao_simples_maior16 text,
  explicacao_simples_menor16 text,
  explicacao_resumido text,
  explicacao_tecnico text,
  "Aula" text,
  "Comentario" text,
  "Narração" text,
  termos jsonb,
  flashcards jsonb,
  questoes jsonb,
  versao_conteudo integer DEFAULT 1,
  ultima_atualizacao timestamp without time zone,
  termos_aprofundados jsonb DEFAULT '{}'::jsonb,
  visualizacoes integer DEFAULT 0,
  ultima_visualizacao timestamp with time zone
);
ALTER TABLE public."CC - Código de Caça" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Público para leitura" ON public."CC - Código de Caça" FOR SELECT USING (true);
CREATE POLICY "Sistema pode atualizar" ON public."CC - Código de Caça" FOR UPDATE USING (true);

-- CP - Código de Pesca
CREATE TABLE IF NOT EXISTS public."CP - Código de Pesca" (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "Número do Artigo" text,
  "Artigo" text,
  exemplo text,
  explicacao_simples_maior16 text,
  explicacao_simples_menor16 text,
  explicacao_resumido text,
  explicacao_tecnico text,
  "Aula" text,
  "Comentario" text,
  "Narração" text,
  termos jsonb,
  flashcards jsonb,
  questoes jsonb,
  versao_conteudo integer DEFAULT 1,
  ultima_atualizacao timestamp without time zone,
  termos_aprofundados jsonb DEFAULT '{}'::jsonb,
  visualizacoes integer DEFAULT 0,
  ultima_visualizacao timestamp with time zone
);
ALTER TABLE public."CP - Código de Pesca" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Público para leitura" ON public."CP - Código de Pesca" FOR SELECT USING (true);
CREATE POLICY "Sistema pode atualizar" ON public."CP - Código de Pesca" FOR UPDATE USING (true);

-- CPI - Código de Propriedade Industrial
CREATE TABLE IF NOT EXISTS public."CPI - Código de Propriedade Industrial" (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "Número do Artigo" text,
  "Artigo" text,
  exemplo text,
  explicacao_simples_maior16 text,
  explicacao_simples_menor16 text,
  explicacao_resumido text,
  explicacao_tecnico text,
  "Aula" text,
  "Comentario" text,
  "Narração" text,
  termos jsonb,
  flashcards jsonb,
  questoes jsonb,
  versao_conteudo integer DEFAULT 1,
  ultima_atualizacao timestamp without time zone,
  termos_aprofundados jsonb DEFAULT '{}'::jsonb,
  visualizacoes integer DEFAULT 0,
  ultima_visualizacao timestamp with time zone
);
ALTER TABLE public."CPI - Código de Propriedade Industrial" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Público para leitura" ON public."CPI - Código de Propriedade Industrial" FOR SELECT USING (true);
CREATE POLICY "Sistema pode atualizar" ON public."CPI - Código de Propriedade Industrial" FOR UPDATE USING (true);

-- CDUS - Código de Defesa do Usuário do Serviço Público
CREATE TABLE IF NOT EXISTS public."CDUS - Código de Defesa do Usuário" (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "Número do Artigo" text,
  "Artigo" text,
  exemplo text,
  explicacao_simples_maior16 text,
  explicacao_simples_menor16 text,
  explicacao_resumido text,
  explicacao_tecnico text,
  "Aula" text,
  "Comentario" text,
  "Narração" text,
  termos jsonb,
  flashcards jsonb,
  questoes jsonb,
  versao_conteudo integer DEFAULT 1,
  ultima_atualizacao timestamp without time zone,
  termos_aprofundados jsonb DEFAULT '{}'::jsonb,
  visualizacoes integer DEFAULT 0,
  ultima_visualizacao timestamp with time zone
);
ALTER TABLE public."CDUS - Código de Defesa do Usuário" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Público para leitura" ON public."CDUS - Código de Defesa do Usuário" FOR SELECT USING (true);
CREATE POLICY "Sistema pode atualizar" ON public."CDUS - Código de Defesa do Usuário" FOR UPDATE USING (true);

-- =====================================================
-- ESTATUTOS (12 tabelas)
-- =====================================================

-- Estatuto dos Militares
CREATE TABLE IF NOT EXISTS public."EST - Estatuto dos Militares" (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "Número do Artigo" text,
  "Artigo" text,
  exemplo text,
  explicacao_simples_maior16 text,
  explicacao_simples_menor16 text,
  explicacao_resumido text,
  explicacao_tecnico text,
  "Aula" text,
  "Comentario" text,
  "Narração" text,
  termos jsonb,
  flashcards jsonb,
  questoes jsonb,
  versao_conteudo integer DEFAULT 1,
  ultima_atualizacao timestamp without time zone,
  termos_aprofundados jsonb DEFAULT '{}'::jsonb,
  visualizacoes integer DEFAULT 0,
  ultima_visualizacao timestamp with time zone
);
ALTER TABLE public."EST - Estatuto dos Militares" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Público para leitura" ON public."EST - Estatuto dos Militares" FOR SELECT USING (true);
CREATE POLICY "Sistema pode atualizar" ON public."EST - Estatuto dos Militares" FOR UPDATE USING (true);

-- Estatuto da Terra
CREATE TABLE IF NOT EXISTS public."EST - Estatuto da Terra" (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "Número do Artigo" text,
  "Artigo" text,
  exemplo text,
  explicacao_simples_maior16 text,
  explicacao_simples_menor16 text,
  explicacao_resumido text,
  explicacao_tecnico text,
  "Aula" text,
  "Comentario" text,
  "Narração" text,
  termos jsonb,
  flashcards jsonb,
  questoes jsonb,
  versao_conteudo integer DEFAULT 1,
  ultima_atualizacao timestamp without time zone,
  termos_aprofundados jsonb DEFAULT '{}'::jsonb,
  visualizacoes integer DEFAULT 0,
  ultima_visualizacao timestamp with time zone
);
ALTER TABLE public."EST - Estatuto da Terra" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Público para leitura" ON public."EST - Estatuto da Terra" FOR SELECT USING (true);
CREATE POLICY "Sistema pode atualizar" ON public."EST - Estatuto da Terra" FOR UPDATE USING (true);

-- Estatuto da Migração
CREATE TABLE IF NOT EXISTS public."EST - Estatuto da Migração" (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "Número do Artigo" text,
  "Artigo" text,
  exemplo text,
  explicacao_simples_maior16 text,
  explicacao_simples_menor16 text,
  explicacao_resumido text,
  explicacao_tecnico text,
  "Aula" text,
  "Comentario" text,
  "Narração" text,
  termos jsonb,
  flashcards jsonb,
  questoes jsonb,
  versao_conteudo integer DEFAULT 1,
  ultima_atualizacao timestamp without time zone,
  termos_aprofundados jsonb DEFAULT '{}'::jsonb,
  visualizacoes integer DEFAULT 0,
  ultima_visualizacao timestamp with time zone
);
ALTER TABLE public."EST - Estatuto da Migração" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Público para leitura" ON public."EST - Estatuto da Migração" FOR SELECT USING (true);
CREATE POLICY "Sistema pode atualizar" ON public."EST - Estatuto da Migração" FOR UPDATE USING (true);

-- Estatuto da Juventude
CREATE TABLE IF NOT EXISTS public."EST - Estatuto da Juventude" (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "Número do Artigo" text,
  "Artigo" text,
  exemplo text,
  explicacao_simples_maior16 text,
  explicacao_simples_menor16 text,
  explicacao_resumido text,
  explicacao_tecnico text,
  "Aula" text,
  "Comentario" text,
  "Narração" text,
  termos jsonb,
  flashcards jsonb,
  questoes jsonb,
  versao_conteudo integer DEFAULT 1,
  ultima_atualizacao timestamp without time zone,
  termos_aprofundados jsonb DEFAULT '{}'::jsonb,
  visualizacoes integer DEFAULT 0,
  ultima_visualizacao timestamp with time zone
);
ALTER TABLE public."EST - Estatuto da Juventude" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Público para leitura" ON public."EST - Estatuto da Juventude" FOR SELECT USING (true);
CREATE POLICY "Sistema pode atualizar" ON public."EST - Estatuto da Juventude" FOR UPDATE USING (true);

-- Estatuto do Índio
CREATE TABLE IF NOT EXISTS public."EST - Estatuto do Índio" (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "Número do Artigo" text,
  "Artigo" text,
  exemplo text,
  explicacao_simples_maior16 text,
  explicacao_simples_menor16 text,
  explicacao_resumido text,
  explicacao_tecnico text,
  "Aula" text,
  "Comentario" text,
  "Narração" text,
  termos jsonb,
  flashcards jsonb,
  questoes jsonb,
  versao_conteudo integer DEFAULT 1,
  ultima_atualizacao timestamp without time zone,
  termos_aprofundados jsonb DEFAULT '{}'::jsonb,
  visualizacoes integer DEFAULT 0,
  ultima_visualizacao timestamp with time zone
);
ALTER TABLE public."EST - Estatuto do Índio" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Público para leitura" ON public."EST - Estatuto do Índio" FOR SELECT USING (true);
CREATE POLICY "Sistema pode atualizar" ON public."EST - Estatuto do Índio" FOR UPDATE USING (true);

-- Estatuto do Refugiado
CREATE TABLE IF NOT EXISTS public."EST - Estatuto do Refugiado" (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "Número do Artigo" text,
  "Artigo" text,
  exemplo text,
  explicacao_simples_maior16 text,
  explicacao_simples_menor16 text,
  explicacao_resumido text,
  explicacao_tecnico text,
  "Aula" text,
  "Comentario" text,
  "Narração" text,
  termos jsonb,
  flashcards jsonb,
  questoes jsonb,
  versao_conteudo integer DEFAULT 1,
  ultima_atualizacao timestamp without time zone,
  termos_aprofundados jsonb DEFAULT '{}'::jsonb,
  visualizacoes integer DEFAULT 0,
  ultima_visualizacao timestamp with time zone
);
ALTER TABLE public."EST - Estatuto do Refugiado" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Público para leitura" ON public."EST - Estatuto do Refugiado" FOR SELECT USING (true);
CREATE POLICY "Sistema pode atualizar" ON public."EST - Estatuto do Refugiado" FOR UPDATE USING (true);

-- Estatuto da Metrópole
CREATE TABLE IF NOT EXISTS public."EST - Estatuto da Metrópole" (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "Número do Artigo" text,
  "Artigo" text,
  exemplo text,
  explicacao_simples_maior16 text,
  explicacao_simples_menor16 text,
  explicacao_resumido text,
  explicacao_tecnico text,
  "Aula" text,
  "Comentario" text,
  "Narração" text,
  termos jsonb,
  flashcards jsonb,
  questoes jsonb,
  versao_conteudo integer DEFAULT 1,
  ultima_atualizacao timestamp without time zone,
  termos_aprofundados jsonb DEFAULT '{}'::jsonb,
  visualizacoes integer DEFAULT 0,
  ultima_visualizacao timestamp with time zone
);
ALTER TABLE public."EST - Estatuto da Metrópole" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Público para leitura" ON public."EST - Estatuto da Metrópole" FOR SELECT USING (true);
CREATE POLICY "Sistema pode atualizar" ON public."EST - Estatuto da Metrópole" FOR UPDATE USING (true);

-- Estatuto do Desporto (Lei Pelé)
CREATE TABLE IF NOT EXISTS public."EST - Estatuto do Desporto" (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "Número do Artigo" text,
  "Artigo" text,
  exemplo text,
  explicacao_simples_maior16 text,
  explicacao_simples_menor16 text,
  explicacao_resumido text,
  explicacao_tecnico text,
  "Aula" text,
  "Comentario" text,
  "Narração" text,
  termos jsonb,
  flashcards jsonb,
  questoes jsonb,
  versao_conteudo integer DEFAULT 1,
  ultima_atualizacao timestamp without time zone,
  termos_aprofundados jsonb DEFAULT '{}'::jsonb,
  visualizacoes integer DEFAULT 0,
  ultima_visualizacao timestamp with time zone
);
ALTER TABLE public."EST - Estatuto do Desporto" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Público para leitura" ON public."EST - Estatuto do Desporto" FOR SELECT USING (true);
CREATE POLICY "Sistema pode atualizar" ON public."EST - Estatuto do Desporto" FOR UPDATE USING (true);

-- Estatuto da Micro e Pequena Empresa
CREATE TABLE IF NOT EXISTS public."EST - Estatuto da MPE" (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "Número do Artigo" text,
  "Artigo" text,
  exemplo text,
  explicacao_simples_maior16 text,
  explicacao_simples_menor16 text,
  explicacao_resumido text,
  explicacao_tecnico text,
  "Aula" text,
  "Comentario" text,
  "Narração" text,
  termos jsonb,
  flashcards jsonb,
  questoes jsonb,
  versao_conteudo integer DEFAULT 1,
  ultima_atualizacao timestamp without time zone,
  termos_aprofundados jsonb DEFAULT '{}'::jsonb,
  visualizacoes integer DEFAULT 0,
  ultima_visualizacao timestamp with time zone
);
ALTER TABLE public."EST - Estatuto da MPE" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Público para leitura" ON public."EST - Estatuto da MPE" FOR SELECT USING (true);
CREATE POLICY "Sistema pode atualizar" ON public."EST - Estatuto da MPE" FOR UPDATE USING (true);

-- Estatuto da Segurança Privada
CREATE TABLE IF NOT EXISTS public."EST - Estatuto Segurança Privada" (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "Número do Artigo" text,
  "Artigo" text,
  exemplo text,
  explicacao_simples_maior16 text,
  explicacao_simples_menor16 text,
  explicacao_resumido text,
  explicacao_tecnico text,
  "Aula" text,
  "Comentario" text,
  "Narração" text,
  termos jsonb,
  flashcards jsonb,
  questoes jsonb,
  versao_conteudo integer DEFAULT 1,
  ultima_atualizacao timestamp without time zone,
  termos_aprofundados jsonb DEFAULT '{}'::jsonb,
  visualizacoes integer DEFAULT 0,
  ultima_visualizacao timestamp with time zone
);
ALTER TABLE public."EST - Estatuto Segurança Privada" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Público para leitura" ON public."EST - Estatuto Segurança Privada" FOR SELECT USING (true);
CREATE POLICY "Sistema pode atualizar" ON public."EST - Estatuto Segurança Privada" FOR UPDATE USING (true);

-- Estatuto do Magistério Superior
CREATE TABLE IF NOT EXISTS public."EST - Estatuto Magistério Superior" (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "Número do Artigo" text,
  "Artigo" text,
  exemplo text,
  explicacao_simples_maior16 text,
  explicacao_simples_menor16 text,
  explicacao_resumido text,
  explicacao_tecnico text,
  "Aula" text,
  "Comentario" text,
  "Narração" text,
  termos jsonb,
  flashcards jsonb,
  questoes jsonb,
  versao_conteudo integer DEFAULT 1,
  ultima_atualizacao timestamp without time zone,
  termos_aprofundados jsonb DEFAULT '{}'::jsonb,
  visualizacoes integer DEFAULT 0,
  ultima_visualizacao timestamp with time zone
);
ALTER TABLE public."EST - Estatuto Magistério Superior" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Público para leitura" ON public."EST - Estatuto Magistério Superior" FOR SELECT USING (true);
CREATE POLICY "Sistema pode atualizar" ON public."EST - Estatuto Magistério Superior" FOR UPDATE USING (true);

-- Estatuto da Pessoa com Câncer
CREATE TABLE IF NOT EXISTS public."EST - Estatuto Pessoa com Câncer" (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "Número do Artigo" text,
  "Artigo" text,
  exemplo text,
  explicacao_simples_maior16 text,
  explicacao_simples_menor16 text,
  explicacao_resumido text,
  explicacao_tecnico text,
  "Aula" text,
  "Comentario" text,
  "Narração" text,
  termos jsonb,
  flashcards jsonb,
  questoes jsonb,
  versao_conteudo integer DEFAULT 1,
  ultima_atualizacao timestamp without time zone,
  termos_aprofundados jsonb DEFAULT '{}'::jsonb,
  visualizacoes integer DEFAULT 0,
  ultima_visualizacao timestamp with time zone
);
ALTER TABLE public."EST - Estatuto Pessoa com Câncer" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Público para leitura" ON public."EST - Estatuto Pessoa com Câncer" FOR SELECT USING (true);
CREATE POLICY "Sistema pode atualizar" ON public."EST - Estatuto Pessoa com Câncer" FOR UPDATE USING (true);

-- =====================================================
-- LEIS ORDINÁRIAS (9 tabelas)
-- =====================================================

-- LINDB
CREATE TABLE IF NOT EXISTS public."LEI 4657 - LINDB" (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "Número do Artigo" text,
  "Artigo" text,
  exemplo text,
  explicacao_simples_maior16 text,
  explicacao_simples_menor16 text,
  explicacao_resumido text,
  explicacao_tecnico text,
  "Aula" text,
  "Comentario" text,
  "Narração" text,
  termos jsonb,
  flashcards jsonb,
  questoes jsonb,
  versao_conteudo integer DEFAULT 1,
  ultima_atualizacao timestamp without time zone,
  termos_aprofundados jsonb DEFAULT '{}'::jsonb,
  visualizacoes integer DEFAULT 0,
  ultima_visualizacao timestamp with time zone
);
ALTER TABLE public."LEI 4657 - LINDB" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Público para leitura" ON public."LEI 4657 - LINDB" FOR SELECT USING (true);
CREATE POLICY "Sistema pode atualizar" ON public."LEI 4657 - LINDB" FOR UPDATE USING (true);

-- Mandado de Segurança
CREATE TABLE IF NOT EXISTS public."LEI 12016 - Mandado de Segurança" (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "Número do Artigo" text,
  "Artigo" text,
  exemplo text,
  explicacao_simples_maior16 text,
  explicacao_simples_menor16 text,
  explicacao_resumido text,
  explicacao_tecnico text,
  "Aula" text,
  "Comentario" text,
  "Narração" text,
  termos jsonb,
  flashcards jsonb,
  questoes jsonb,
  versao_conteudo integer DEFAULT 1,
  ultima_atualizacao timestamp without time zone,
  termos_aprofundados jsonb DEFAULT '{}'::jsonb,
  visualizacoes integer DEFAULT 0,
  ultima_visualizacao timestamp with time zone
);
ALTER TABLE public."LEI 12016 - Mandado de Segurança" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Público para leitura" ON public."LEI 12016 - Mandado de Segurança" FOR SELECT USING (true);
CREATE POLICY "Sistema pode atualizar" ON public."LEI 12016 - Mandado de Segurança" FOR UPDATE USING (true);

-- Habeas Data
CREATE TABLE IF NOT EXISTS public."LEI 9507 - Habeas Data" (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "Número do Artigo" text,
  "Artigo" text,
  exemplo text,
  explicacao_simples_maior16 text,
  explicacao_simples_menor16 text,
  explicacao_resumido text,
  explicacao_tecnico text,
  "Aula" text,
  "Comentario" text,
  "Narração" text,
  termos jsonb,
  flashcards jsonb,
  questoes jsonb,
  versao_conteudo integer DEFAULT 1,
  ultima_atualizacao timestamp without time zone,
  termos_aprofundados jsonb DEFAULT '{}'::jsonb,
  visualizacoes integer DEFAULT 0,
  ultima_visualizacao timestamp with time zone
);
ALTER TABLE public."LEI 9507 - Habeas Data" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Público para leitura" ON public."LEI 9507 - Habeas Data" FOR SELECT USING (true);
CREATE POLICY "Sistema pode atualizar" ON public."LEI 9507 - Habeas Data" FOR UPDATE USING (true);

-- Pregão
CREATE TABLE IF NOT EXISTS public."LEI 10520 - Pregão" (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "Número do Artigo" text,
  "Artigo" text,
  exemplo text,
  explicacao_simples_maior16 text,
  explicacao_simples_menor16 text,
  explicacao_resumido text,
  explicacao_tecnico text,
  "Aula" text,
  "Comentario" text,
  "Narração" text,
  termos jsonb,
  flashcards jsonb,
  questoes jsonb,
  versao_conteudo integer DEFAULT 1,
  ultima_atualizacao timestamp without time zone,
  termos_aprofundados jsonb DEFAULT '{}'::jsonb,
  visualizacoes integer DEFAULT 0,
  ultima_visualizacao timestamp with time zone
);
ALTER TABLE public."LEI 10520 - Pregão" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Público para leitura" ON public."LEI 10520 - Pregão" FOR SELECT USING (true);
CREATE POLICY "Sistema pode atualizar" ON public."LEI 10520 - Pregão" FOR UPDATE USING (true);

-- Marco Civil da Internet
CREATE TABLE IF NOT EXISTS public."LEI 12965 - Marco Civil Internet" (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "Número do Artigo" text,
  "Artigo" text,
  exemplo text,
  explicacao_simples_maior16 text,
  explicacao_simples_menor16 text,
  explicacao_resumido text,
  explicacao_tecnico text,
  "Aula" text,
  "Comentario" text,
  "Narração" text,
  termos jsonb,
  flashcards jsonb,
  questoes jsonb,
  versao_conteudo integer DEFAULT 1,
  ultima_atualizacao timestamp without time zone,
  termos_aprofundados jsonb DEFAULT '{}'::jsonb,
  visualizacoes integer DEFAULT 0,
  ultima_visualizacao timestamp with time zone
);
ALTER TABLE public."LEI 12965 - Marco Civil Internet" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Público para leitura" ON public."LEI 12965 - Marco Civil Internet" FOR SELECT USING (true);
CREATE POLICY "Sistema pode atualizar" ON public."LEI 12965 - Marco Civil Internet" FOR UPDATE USING (true);

-- Arbitragem
CREATE TABLE IF NOT EXISTS public."LEI 9307 - Arbitragem" (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "Número do Artigo" text,
  "Artigo" text,
  exemplo text,
  explicacao_simples_maior16 text,
  explicacao_simples_menor16 text,
  explicacao_resumido text,
  explicacao_tecnico text,
  "Aula" text,
  "Comentario" text,
  "Narração" text,
  termos jsonb,
  flashcards jsonb,
  questoes jsonb,
  versao_conteudo integer DEFAULT 1,
  ultima_atualizacao timestamp without time zone,
  termos_aprofundados jsonb DEFAULT '{}'::jsonb,
  visualizacoes integer DEFAULT 0,
  ultima_visualizacao timestamp with time zone
);
ALTER TABLE public."LEI 9307 - Arbitragem" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Público para leitura" ON public."LEI 9307 - Arbitragem" FOR SELECT USING (true);
CREATE POLICY "Sistema pode atualizar" ON public."LEI 9307 - Arbitragem" FOR UPDATE USING (true);

-- Inquilinato
CREATE TABLE IF NOT EXISTS public."LEI 8245 - Inquilinato" (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "Número do Artigo" text,
  "Artigo" text,
  exemplo text,
  explicacao_simples_maior16 text,
  explicacao_simples_menor16 text,
  explicacao_resumido text,
  explicacao_tecnico text,
  "Aula" text,
  "Comentario" text,
  "Narração" text,
  termos jsonb,
  flashcards jsonb,
  questoes jsonb,
  versao_conteudo integer DEFAULT 1,
  ultima_atualizacao timestamp without time zone,
  termos_aprofundados jsonb DEFAULT '{}'::jsonb,
  visualizacoes integer DEFAULT 0,
  ultima_visualizacao timestamp with time zone
);
ALTER TABLE public."LEI 8245 - Inquilinato" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Público para leitura" ON public."LEI 8245 - Inquilinato" FOR SELECT USING (true);
CREATE POLICY "Sistema pode atualizar" ON public."LEI 8245 - Inquilinato" FOR UPDATE USING (true);

-- Desapropriação
CREATE TABLE IF NOT EXISTS public."LEI 3365 - Desapropriação" (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "Número do Artigo" text,
  "Artigo" text,
  exemplo text,
  explicacao_simples_maior16 text,
  explicacao_simples_menor16 text,
  explicacao_resumido text,
  explicacao_tecnico text,
  "Aula" text,
  "Comentario" text,
  "Narração" text,
  termos jsonb,
  flashcards jsonb,
  questoes jsonb,
  versao_conteudo integer DEFAULT 1,
  ultima_atualizacao timestamp without time zone,
  termos_aprofundados jsonb DEFAULT '{}'::jsonb,
  visualizacoes integer DEFAULT 0,
  ultima_visualizacao timestamp with time zone
);
ALTER TABLE public."LEI 3365 - Desapropriação" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Público para leitura" ON public."LEI 3365 - Desapropriação" FOR SELECT USING (true);
CREATE POLICY "Sistema pode atualizar" ON public."LEI 3365 - Desapropriação" FOR UPDATE USING (true);

-- Política Nacional do Meio Ambiente
CREATE TABLE IF NOT EXISTS public."LEI 6938 - Meio Ambiente" (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "Número do Artigo" text,
  "Artigo" text,
  exemplo text,
  explicacao_simples_maior16 text,
  explicacao_simples_menor16 text,
  explicacao_resumido text,
  explicacao_tecnico text,
  "Aula" text,
  "Comentario" text,
  "Narração" text,
  termos jsonb,
  flashcards jsonb,
  questoes jsonb,
  versao_conteudo integer DEFAULT 1,
  ultima_atualizacao timestamp without time zone,
  termos_aprofundados jsonb DEFAULT '{}'::jsonb,
  visualizacoes integer DEFAULT 0,
  ultima_visualizacao timestamp with time zone
);
ALTER TABLE public."LEI 6938 - Meio Ambiente" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Público para leitura" ON public."LEI 6938 - Meio Ambiente" FOR SELECT USING (true);
CREATE POLICY "Sistema pode atualizar" ON public."LEI 6938 - Meio Ambiente" FOR UPDATE USING (true);

-- =====================================================
-- LEIS ESPECIAIS (11 tabelas)
-- =====================================================

-- Recuperação Judicial e Falência
CREATE TABLE IF NOT EXISTS public."LEI 11101 - Recuperação e Falência" (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "Número do Artigo" text,
  "Artigo" text,
  exemplo text,
  explicacao_simples_maior16 text,
  explicacao_simples_menor16 text,
  explicacao_resumido text,
  explicacao_tecnico text,
  "Aula" text,
  "Comentario" text,
  "Narração" text,
  termos jsonb,
  flashcards jsonb,
  questoes jsonb,
  versao_conteudo integer DEFAULT 1,
  ultima_atualizacao timestamp without time zone,
  termos_aprofundados jsonb DEFAULT '{}'::jsonb,
  visualizacoes integer DEFAULT 0,
  ultima_visualizacao timestamp with time zone
);
ALTER TABLE public."LEI 11101 - Recuperação e Falência" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Público para leitura" ON public."LEI 11101 - Recuperação e Falência" FOR SELECT USING (true);
CREATE POLICY "Sistema pode atualizar" ON public."LEI 11101 - Recuperação e Falência" FOR UPDATE USING (true);

-- Crimes Ambientais
CREATE TABLE IF NOT EXISTS public."LEI 9605 - Crimes Ambientais" (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "Número do Artigo" text,
  "Artigo" text,
  exemplo text,
  explicacao_simples_maior16 text,
  explicacao_simples_menor16 text,
  explicacao_resumido text,
  explicacao_tecnico text,
  "Aula" text,
  "Comentario" text,
  "Narração" text,
  termos jsonb,
  flashcards jsonb,
  questoes jsonb,
  versao_conteudo integer DEFAULT 1,
  ultima_atualizacao timestamp without time zone,
  termos_aprofundados jsonb DEFAULT '{}'::jsonb,
  visualizacoes integer DEFAULT 0,
  ultima_visualizacao timestamp with time zone
);
ALTER TABLE public."LEI 9605 - Crimes Ambientais" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Público para leitura" ON public."LEI 9605 - Crimes Ambientais" FOR SELECT USING (true);
CREATE POLICY "Sistema pode atualizar" ON public."LEI 9605 - Crimes Ambientais" FOR UPDATE USING (true);

-- Feminicídio
CREATE TABLE IF NOT EXISTS public."LEI 13104 - Feminicídio" (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "Número do Artigo" text,
  "Artigo" text,
  exemplo text,
  explicacao_simples_maior16 text,
  explicacao_simples_menor16 text,
  explicacao_resumido text,
  explicacao_tecnico text,
  "Aula" text,
  "Comentario" text,
  "Narração" text,
  termos jsonb,
  flashcards jsonb,
  questoes jsonb,
  versao_conteudo integer DEFAULT 1,
  ultima_atualizacao timestamp without time zone,
  termos_aprofundados jsonb DEFAULT '{}'::jsonb,
  visualizacoes integer DEFAULT 0,
  ultima_visualizacao timestamp with time zone
);
ALTER TABLE public."LEI 13104 - Feminicídio" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Público para leitura" ON public."LEI 13104 - Feminicídio" FOR SELECT USING (true);
CREATE POLICY "Sistema pode atualizar" ON public."LEI 13104 - Feminicídio" FOR UPDATE USING (true);

-- Antiterrorismo
CREATE TABLE IF NOT EXISTS public."LEI 13260 - Antiterrorismo" (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "Número do Artigo" text,
  "Artigo" text,
  exemplo text,
  explicacao_simples_maior16 text,
  explicacao_simples_menor16 text,
  explicacao_resumido text,
  explicacao_tecnico text,
  "Aula" text,
  "Comentario" text,
  "Narração" text,
  termos jsonb,
  flashcards jsonb,
  questoes jsonb,
  versao_conteudo integer DEFAULT 1,
  ultima_atualizacao timestamp without time zone,
  termos_aprofundados jsonb DEFAULT '{}'::jsonb,
  visualizacoes integer DEFAULT 0,
  ultima_visualizacao timestamp with time zone
);
ALTER TABLE public."LEI 13260 - Antiterrorismo" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Público para leitura" ON public."LEI 13260 - Antiterrorismo" FOR SELECT USING (true);
CREATE POLICY "Sistema pode atualizar" ON public."LEI 13260 - Antiterrorismo" FOR UPDATE USING (true);

-- Crimes contra o Sistema Financeiro
CREATE TABLE IF NOT EXISTS public."LEI 7492 - Crimes Sistema Financeiro" (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "Número do Artigo" text,
  "Artigo" text,
  exemplo text,
  explicacao_simples_maior16 text,
  explicacao_simples_menor16 text,
  explicacao_resumido text,
  explicacao_tecnico text,
  "Aula" text,
  "Comentario" text,
  "Narração" text,
  termos jsonb,
  flashcards jsonb,
  questoes jsonb,
  versao_conteudo integer DEFAULT 1,
  ultima_atualizacao timestamp without time zone,
  termos_aprofundados jsonb DEFAULT '{}'::jsonb,
  visualizacoes integer DEFAULT 0,
  ultima_visualizacao timestamp with time zone
);
ALTER TABLE public."LEI 7492 - Crimes Sistema Financeiro" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Público para leitura" ON public."LEI 7492 - Crimes Sistema Financeiro" FOR SELECT USING (true);
CREATE POLICY "Sistema pode atualizar" ON public."LEI 7492 - Crimes Sistema Financeiro" FOR UPDATE USING (true);

-- Crimes contra a Ordem Tributária
CREATE TABLE IF NOT EXISTS public."LEI 8137 - Crimes Ordem Tributária" (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "Número do Artigo" text,
  "Artigo" text,
  exemplo text,
  explicacao_simples_maior16 text,
  explicacao_simples_menor16 text,
  explicacao_resumido text,
  explicacao_tecnico text,
  "Aula" text,
  "Comentario" text,
  "Narração" text,
  termos jsonb,
  flashcards jsonb,
  questoes jsonb,
  versao_conteudo integer DEFAULT 1,
  ultima_atualizacao timestamp without time zone,
  termos_aprofundados jsonb DEFAULT '{}'::jsonb,
  visualizacoes integer DEFAULT 0,
  ultima_visualizacao timestamp with time zone
);
ALTER TABLE public."LEI 8137 - Crimes Ordem Tributária" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Público para leitura" ON public."LEI 8137 - Crimes Ordem Tributária" FOR SELECT USING (true);
CREATE POLICY "Sistema pode atualizar" ON public."LEI 8137 - Crimes Ordem Tributária" FOR UPDATE USING (true);

-- Ficha Limpa
CREATE TABLE IF NOT EXISTS public."LC 135 - Ficha Limpa" (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "Número do Artigo" text,
  "Artigo" text,
  exemplo text,
  explicacao_simples_maior16 text,
  explicacao_simples_menor16 text,
  explicacao_resumido text,
  explicacao_tecnico text,
  "Aula" text,
  "Comentario" text,
  "Narração" text,
  termos jsonb,
  flashcards jsonb,
  questoes jsonb,
  versao_conteudo integer DEFAULT 1,
  ultima_atualizacao timestamp without time zone,
  termos_aprofundados jsonb DEFAULT '{}'::jsonb,
  visualizacoes integer DEFAULT 0,
  ultima_visualizacao timestamp with time zone
);
ALTER TABLE public."LC 135 - Ficha Limpa" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Público para leitura" ON public."LC 135 - Ficha Limpa" FOR SELECT USING (true);
CREATE POLICY "Sistema pode atualizar" ON public."LC 135 - Ficha Limpa" FOR UPDATE USING (true);

-- Crimes de Responsabilidade
CREATE TABLE IF NOT EXISTS public."LEI 1079 - Crimes Responsabilidade" (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "Número do Artigo" text,
  "Artigo" text,
  exemplo text,
  explicacao_simples_maior16 text,
  explicacao_simples_menor16 text,
  explicacao_resumido text,
  explicacao_tecnico text,
  "Aula" text,
  "Comentario" text,
  "Narração" text,
  termos jsonb,
  flashcards jsonb,
  questoes jsonb,
  versao_conteudo integer DEFAULT 1,
  ultima_atualizacao timestamp without time zone,
  termos_aprofundados jsonb DEFAULT '{}'::jsonb,
  visualizacoes integer DEFAULT 0,
  ultima_visualizacao timestamp with time zone
);
ALTER TABLE public."LEI 1079 - Crimes Responsabilidade" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Público para leitura" ON public."LEI 1079 - Crimes Responsabilidade" FOR SELECT USING (true);
CREATE POLICY "Sistema pode atualizar" ON public."LEI 1079 - Crimes Responsabilidade" FOR UPDATE USING (true);

-- Crimes Transnacionais
CREATE TABLE IF NOT EXISTS public."LEI 5015 - Crimes Transnacionais" (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "Número do Artigo" text,
  "Artigo" text,
  exemplo text,
  explicacao_simples_maior16 text,
  explicacao_simples_menor16 text,
  explicacao_resumido text,
  explicacao_tecnico text,
  "Aula" text,
  "Comentario" text,
  "Narração" text,
  termos jsonb,
  flashcards jsonb,
  questoes jsonb,
  versao_conteudo integer DEFAULT 1,
  ultima_atualizacao timestamp without time zone,
  termos_aprofundados jsonb DEFAULT '{}'::jsonb,
  visualizacoes integer DEFAULT 0,
  ultima_visualizacao timestamp with time zone
);
ALTER TABLE public."LEI 5015 - Crimes Transnacionais" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Público para leitura" ON public."LEI 5015 - Crimes Transnacionais" FOR SELECT USING (true);
CREATE POLICY "Sistema pode atualizar" ON public."LEI 5015 - Crimes Transnacionais" FOR UPDATE USING (true);

-- Código Comercial (já existe mas vou verificar)
-- CLT (já existe)
-- Consolidação das Leis do Trabalho (já existe)
