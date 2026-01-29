-- Criar tabela para leis de 2024
CREATE TABLE IF NOT EXISTS public.leis_push_2024 (
  id SERIAL PRIMARY KEY,
  tipo TEXT,
  numero TEXT,
  data_publicacao TEXT,
  ementa TEXT,
  link_planalto TEXT,
  resumo_ia TEXT,
  areas_direito TEXT[],
  impacto_pratico TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela para leis de 2023
CREATE TABLE IF NOT EXISTS public.leis_push_2023 (
  id SERIAL PRIMARY KEY,
  tipo TEXT,
  numero TEXT,
  data_publicacao TEXT,
  ementa TEXT,
  link_planalto TEXT,
  resumo_ia TEXT,
  areas_direito TEXT[],
  impacto_pratico TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela para leis de 2022
CREATE TABLE IF NOT EXISTS public.leis_push_2022 (
  id SERIAL PRIMARY KEY,
  tipo TEXT,
  numero TEXT,
  data_publicacao TEXT,
  ementa TEXT,
  link_planalto TEXT,
  resumo_ia TEXT,
  areas_direito TEXT[],
  impacto_pratico TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela para leis de 2021
CREATE TABLE IF NOT EXISTS public.leis_push_2021 (
  id SERIAL PRIMARY KEY,
  tipo TEXT,
  numero TEXT,
  data_publicacao TEXT,
  ementa TEXT,
  link_planalto TEXT,
  resumo_ia TEXT,
  areas_direito TEXT[],
  impacto_pratico TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela para leis de 2020
CREATE TABLE IF NOT EXISTS public.leis_push_2020 (
  id SERIAL PRIMARY KEY,
  tipo TEXT,
  numero TEXT,
  data_publicacao TEXT,
  ementa TEXT,
  link_planalto TEXT,
  resumo_ia TEXT,
  areas_direito TEXT[],
  impacto_pratico TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.leis_push_2024 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leis_push_2023 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leis_push_2022 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leis_push_2021 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leis_push_2020 ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura pública
CREATE POLICY "Leitura pública leis 2024" ON public.leis_push_2024 FOR SELECT USING (true);
CREATE POLICY "Leitura pública leis 2023" ON public.leis_push_2023 FOR SELECT USING (true);
CREATE POLICY "Leitura pública leis 2022" ON public.leis_push_2022 FOR SELECT USING (true);
CREATE POLICY "Leitura pública leis 2021" ON public.leis_push_2021 FOR SELECT USING (true);
CREATE POLICY "Leitura pública leis 2020" ON public.leis_push_2020 FOR SELECT USING (true);

-- Índices para busca
CREATE INDEX idx_leis_2024_tipo ON public.leis_push_2024(tipo);
CREATE INDEX idx_leis_2024_data ON public.leis_push_2024(data_publicacao);
CREATE INDEX idx_leis_2023_tipo ON public.leis_push_2023(tipo);
CREATE INDEX idx_leis_2023_data ON public.leis_push_2023(data_publicacao);
CREATE INDEX idx_leis_2022_tipo ON public.leis_push_2022(tipo);
CREATE INDEX idx_leis_2022_data ON public.leis_push_2022(data_publicacao);
CREATE INDEX idx_leis_2021_tipo ON public.leis_push_2021(tipo);
CREATE INDEX idx_leis_2021_data ON public.leis_push_2021(data_publicacao);
CREATE INDEX idx_leis_2020_tipo ON public.leis_push_2020(tipo);
CREATE INDEX idx_leis_2020_data ON public.leis_push_2020(data_publicacao);