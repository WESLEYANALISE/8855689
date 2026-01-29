-- Criar tabelas específicas para cada categoria do Meu Brasil

-- Tabela de Juristas com fotos
CREATE TABLE IF NOT EXISTS public.meu_brasil_juristas (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT UNIQUE NOT NULL,
  categoria TEXT NOT NULL,
  foto_url TEXT,
  periodo TEXT,
  area TEXT,
  conteudo_original JSONB,
  conteudo_melhorado JSONB,
  imagens JSONB DEFAULT '[]'::jsonb,
  links_relacionados JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Instituições
CREATE TABLE IF NOT EXISTS public.meu_brasil_instituicoes (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT UNIQUE NOT NULL,
  sigla TEXT,
  logo_url TEXT,
  tipo TEXT,
  conteudo_original JSONB,
  conteudo_melhorado JSONB,
  imagens JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Casos Jurídicos
CREATE TABLE IF NOT EXISTS public.meu_brasil_casos (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT UNIQUE NOT NULL,
  ano INTEGER,
  tipo TEXT,
  conteudo_original JSONB,
  conteudo_melhorado JSONB,
  timeline JSONB DEFAULT '[]'::jsonb,
  pessoas_envolvidas JSONB DEFAULT '[]'::jsonb,
  imagens JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Sistemas Jurídicos
CREATE TABLE IF NOT EXISTS public.meu_brasil_sistemas (
  id BIGSERIAL PRIMARY KEY,
  pais TEXT UNIQUE NOT NULL,
  bandeira_url TEXT,
  tipo_sistema TEXT,
  conteudo_original JSONB,
  conteudo_melhorado JSONB,
  comparacao_brasil JSONB,
  imagens JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de História Jurídica
CREATE TABLE IF NOT EXISTS public.meu_brasil_historia (
  id BIGSERIAL PRIMARY KEY,
  periodo TEXT UNIQUE NOT NULL,
  ano_inicio INTEGER,
  ano_fim INTEGER,
  titulo TEXT,
  conteudo_original JSONB,
  conteudo_melhorado JSONB,
  marcos_importantes JSONB DEFAULT '[]'::jsonb,
  imagens JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies - Todas públicas para leitura
ALTER TABLE public.meu_brasil_juristas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meu_brasil_instituicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meu_brasil_casos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meu_brasil_sistemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meu_brasil_historia ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura pública
CREATE POLICY "Juristas públicos para leitura" ON public.meu_brasil_juristas
  FOR SELECT USING (true);

CREATE POLICY "Instituições públicas para leitura" ON public.meu_brasil_instituicoes
  FOR SELECT USING (true);

CREATE POLICY "Casos públicos para leitura" ON public.meu_brasil_casos
  FOR SELECT USING (true);

CREATE POLICY "Sistemas públicos para leitura" ON public.meu_brasil_sistemas
  FOR SELECT USING (true);

CREATE POLICY "História pública para leitura" ON public.meu_brasil_historia
  FOR SELECT USING (true);

-- Políticas para sistema inserir/atualizar
CREATE POLICY "Sistema pode gerenciar juristas" ON public.meu_brasil_juristas
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Sistema pode gerenciar instituições" ON public.meu_brasil_instituicoes
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Sistema pode gerenciar casos" ON public.meu_brasil_casos
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Sistema pode gerenciar sistemas" ON public.meu_brasil_sistemas
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Sistema pode gerenciar história" ON public.meu_brasil_historia
  FOR ALL USING (true) WITH CHECK (true);

-- Índices para melhor performance
CREATE INDEX idx_juristas_categoria ON public.meu_brasil_juristas(categoria);
CREATE INDEX idx_juristas_nome ON public.meu_brasil_juristas(nome);
CREATE INDEX idx_instituicoes_nome ON public.meu_brasil_instituicoes(nome);
CREATE INDEX idx_casos_tipo ON public.meu_brasil_casos(tipo);
CREATE INDEX idx_sistemas_pais ON public.meu_brasil_sistemas(pais);
CREATE INDEX idx_historia_periodo ON public.meu_brasil_historia(periodo);