-- Tabela para Lei 14.197/2021 - Crimes Contra o Estado Democrático
CREATE TABLE "Lei 14.197 de 2021 - Crimes Contra o Estado Democrático" (
  id bigserial PRIMARY KEY,
  "Número do Artigo" text,
  "Artigo" text,
  "Narração" text,
  "Comentario" text,
  "Aula" text,
  explicacao_tecnico text,
  explicacao_resumido text,
  explicacao_simples_menor16 text,
  explicacao_simples_maior16 text,
  exemplo text,
  versao_conteudo integer DEFAULT 1,
  termos jsonb,
  flashcards jsonb,
  questoes jsonb,
  ultima_atualizacao timestamp without time zone,
  termos_aprofundados jsonb DEFAULT '{}'::jsonb,
  visualizacoes integer DEFAULT 0,
  ultima_visualizacao timestamp with time zone
);

ALTER TABLE "Lei 14.197 de 2021 - Crimes Contra o Estado Democrático" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lei 14.197 é pública para leitura" ON "Lei 14.197 de 2021 - Crimes Contra o Estado Democrático"
  FOR SELECT USING (true);

CREATE POLICY "Sistema pode atualizar Lei 14.197" ON "Lei 14.197 de 2021 - Crimes Contra o Estado Democrático"
  FOR UPDATE USING (true);

-- Tabela para Lei 13.869/2019 - Abuso de Autoridade
CREATE TABLE "Lei 13.869 de 2019 - Abuso de Autoridade" (
  id bigserial PRIMARY KEY,
  "Número do Artigo" text,
  "Artigo" text,
  "Narração" text,
  "Comentario" text,
  "Aula" text,
  explicacao_tecnico text,
  explicacao_resumido text,
  explicacao_simples_menor16 text,
  explicacao_simples_maior16 text,
  exemplo text,
  versao_conteudo integer DEFAULT 1,
  termos jsonb,
  flashcards jsonb,
  questoes jsonb,
  ultima_atualizacao timestamp without time zone,
  termos_aprofundados jsonb DEFAULT '{}'::jsonb,
  visualizacoes integer DEFAULT 0,
  ultima_visualizacao timestamp with time zone
);

ALTER TABLE "Lei 13.869 de 2019 - Abuso de Autoridade" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lei 13.869 é pública para leitura" ON "Lei 13.869 de 2019 - Abuso de Autoridade"
  FOR SELECT USING (true);

CREATE POLICY "Sistema pode atualizar Lei 13.869" ON "Lei 13.869 de 2019 - Abuso de Autoridade"
  FOR UPDATE USING (true);

-- Tabela para Lei 13.964/2019 - Pacote Anticrime (formato especial)
CREATE TABLE "Lei 13.964 de 2019 - Pacote Anticrime" (
  id bigserial PRIMARY KEY,
  "Lei Alterada" text,
  "Artigo Modificado" text,
  "Tipo de Alteração" text,
  "Texto Original" text,
  "Texto Novo" text,
  "Número do Artigo" text,
  "Artigo" text,
  "Narração" text,
  "Comentario" text,
  "Aula" text,
  explicacao_tecnico text,
  explicacao_resumido text,
  explicacao_simples_menor16 text,
  explicacao_simples_maior16 text,
  exemplo text,
  versao_conteudo integer DEFAULT 1,
  termos jsonb,
  flashcards jsonb,
  questoes jsonb,
  ultima_atualizacao timestamp without time zone,
  termos_aprofundados jsonb DEFAULT '{}'::jsonb,
  visualizacoes integer DEFAULT 0,
  ultima_visualizacao timestamp with time zone
);

ALTER TABLE "Lei 13.964 de 2019 - Pacote Anticrime" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lei 13.964 é pública para leitura" ON "Lei 13.964 de 2019 - Pacote Anticrime"
  FOR SELECT USING (true);

CREATE POLICY "Sistema pode atualizar Lei 13.964" ON "Lei 13.964 de 2019 - Pacote Anticrime"
  FOR UPDATE USING (true);