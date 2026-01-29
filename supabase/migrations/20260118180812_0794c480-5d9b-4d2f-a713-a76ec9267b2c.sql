-- =============================================
-- TABELAS PARA ÉTICA PROFISSIONAL NAS TRILHAS OAB
-- =============================================

-- 1. Tabela de Temas (Os 5 Livros de Ética)
CREATE TABLE public.oab_etica_temas (
  id SERIAL PRIMARY KEY,
  ordem INTEGER NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  livro_id BIGINT,
  capa_url TEXT,
  total_topicos INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pendente',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabela de Tópicos (Extraídos de Cada Livro)
CREATE TABLE public.oab_etica_topicos (
  id SERIAL PRIMARY KEY,
  tema_id INTEGER REFERENCES public.oab_etica_temas(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL,
  titulo TEXT NOT NULL,
  conteudo_gerado TEXT,
  exemplos JSONB,
  termos JSONB,
  flashcards JSONB,
  questoes JSONB,
  capa_url TEXT,
  url_narracao TEXT,
  status TEXT DEFAULT 'pendente',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_oab_etica_temas_ordem ON public.oab_etica_temas(ordem);
CREATE INDEX idx_oab_etica_topicos_tema_id ON public.oab_etica_topicos(tema_id);
CREATE INDEX idx_oab_etica_topicos_ordem ON public.oab_etica_topicos(ordem);

-- Enable RLS
ALTER TABLE public.oab_etica_temas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oab_etica_topicos ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público (leitura)
CREATE POLICY "Temas de ética são públicos para leitura"
  ON public.oab_etica_temas FOR SELECT
  USING (true);

CREATE POLICY "Tópicos de ética são públicos para leitura"
  ON public.oab_etica_topicos FOR SELECT
  USING (true);

-- Políticas para service role (escrita)
CREATE POLICY "Service role pode inserir temas"
  ON public.oab_etica_temas FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role pode atualizar temas"
  ON public.oab_etica_temas FOR UPDATE
  USING (true);

CREATE POLICY "Service role pode inserir tópicos"
  ON public.oab_etica_topicos FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role pode atualizar tópicos"
  ON public.oab_etica_topicos FOR UPDATE
  USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_oab_etica_temas_updated_at
  BEFORE UPDATE ON public.oab_etica_temas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_oab_etica_topicos_updated_at
  BEFORE UPDATE ON public.oab_etica_topicos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- SEED INICIAL: Inserir os 5 Livros de Ética
-- =============================================

INSERT INTO public.oab_etica_temas (ordem, titulo, descricao, livro_id)
VALUES 
  (1, 'Aspectos Introdutórios da Ética Profissional', 'Fundamentos e princípios éticos da advocacia, conceitos básicos do Estatuto da OAB', 26),
  (2, 'A Advocacia e o Exercício Profissional', 'Direitos, deveres e prerrogativas do advogado no exercício da profissão', 27),
  (3, 'Direitos dos Advogados', 'Garantias, imunidades e prerrogativas profissionais asseguradas ao advogado', 28),
  (4, 'Infrações, Sanções e Processo Disciplinar', 'Faltas éticas, penalidades e procedimento disciplinar na OAB', 29),
  (5, 'Eleições e Órgãos da OAB', 'Estrutura organizacional da OAB e processo eleitoral interno', 30);