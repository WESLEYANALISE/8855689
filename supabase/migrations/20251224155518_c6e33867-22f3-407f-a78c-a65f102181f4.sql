-- Tabela para cache de presidentes do Brasil
CREATE TABLE public.tres_poderes_presidentes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  nome_completo TEXT,
  periodo_inicio INTEGER,
  periodo_fim INTEGER,
  partido TEXT,
  vice_presidente TEXT,
  foto_url TEXT,
  foto_wikipedia TEXT,
  biografia TEXT,
  realizacoes TEXT[],
  curiosidades TEXT[],
  legado TEXT,
  ordem INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para cache de ministros do STF
CREATE TABLE public.tres_poderes_ministros_stf (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  nome_completo TEXT,
  foto_url TEXT,
  foto_wikipedia TEXT,
  data_posse DATE,
  indicado_por TEXT,
  biografia TEXT,
  formacao TEXT,
  carreira TEXT,
  decisoes_importantes TEXT[],
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para cache de biografias de deputados (Wikipedia + Gemini)
CREATE TABLE public.tres_poderes_deputados_bio (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deputado_id INTEGER NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  partido TEXT,
  uf TEXT,
  foto_url TEXT,
  foto_wikipedia TEXT,
  biografia TEXT,
  formacao TEXT,
  carreira_politica TEXT,
  projetos_destaque TEXT[],
  mandatos TEXT[],
  redes_sociais JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para cache de biografias de senadores (Wikipedia + Gemini)
CREATE TABLE public.tres_poderes_senadores_bio (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  senador_codigo INTEGER NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  partido TEXT,
  uf TEXT,
  foto_url TEXT,
  foto_wikipedia TEXT,
  biografia TEXT,
  formacao TEXT,
  carreira_politica TEXT,
  projetos_destaque TEXT[],
  mandatos TEXT[],
  redes_sociais JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para configurações e imagens de fundo dos Três Poderes
CREATE TABLE public.tres_poderes_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_key TEXT NOT NULL UNIQUE,
  background_url TEXT,
  opacity NUMERIC DEFAULT 0.3,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tres_poderes_presidentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tres_poderes_ministros_stf ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tres_poderes_deputados_bio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tres_poderes_senadores_bio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tres_poderes_config ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura pública (dados públicos)
CREATE POLICY "Allow public read for tres_poderes_presidentes"
ON public.tres_poderes_presidentes FOR SELECT USING (true);

CREATE POLICY "Allow public read for tres_poderes_ministros_stf"
ON public.tres_poderes_ministros_stf FOR SELECT USING (true);

CREATE POLICY "Allow public read for tres_poderes_deputados_bio"
ON public.tres_poderes_deputados_bio FOR SELECT USING (true);

CREATE POLICY "Allow public read for tres_poderes_senadores_bio"
ON public.tres_poderes_senadores_bio FOR SELECT USING (true);

CREATE POLICY "Allow public read for tres_poderes_config"
ON public.tres_poderes_config FOR SELECT USING (true);

-- Políticas de inserção/atualização via service role (edge functions)
CREATE POLICY "Allow service insert for tres_poderes_presidentes"
ON public.tres_poderes_presidentes FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow service update for tres_poderes_presidentes"
ON public.tres_poderes_presidentes FOR UPDATE USING (true);

CREATE POLICY "Allow service insert for tres_poderes_ministros_stf"
ON public.tres_poderes_ministros_stf FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow service update for tres_poderes_ministros_stf"
ON public.tres_poderes_ministros_stf FOR UPDATE USING (true);

CREATE POLICY "Allow service insert for tres_poderes_deputados_bio"
ON public.tres_poderes_deputados_bio FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow service update for tres_poderes_deputados_bio"
ON public.tres_poderes_deputados_bio FOR UPDATE USING (true);

CREATE POLICY "Allow service insert for tres_poderes_senadores_bio"
ON public.tres_poderes_senadores_bio FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow service update for tres_poderes_senadores_bio"
ON public.tres_poderes_senadores_bio FOR UPDATE USING (true);

CREATE POLICY "Allow service insert for tres_poderes_config"
ON public.tres_poderes_config FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow service update for tres_poderes_config"
ON public.tres_poderes_config FOR UPDATE USING (true);

-- Índices para performance
CREATE INDEX idx_tres_poderes_presidentes_ordem ON public.tres_poderes_presidentes(ordem);
CREATE INDEX idx_tres_poderes_ministros_stf_ativo ON public.tres_poderes_ministros_stf(ativo);
CREATE INDEX idx_tres_poderes_deputados_bio_id ON public.tres_poderes_deputados_bio(deputado_id);
CREATE INDEX idx_tres_poderes_senadores_bio_codigo ON public.tres_poderes_senadores_bio(senador_codigo);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_tres_poderes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tres_poderes_presidentes_updated_at
BEFORE UPDATE ON public.tres_poderes_presidentes
FOR EACH ROW EXECUTE FUNCTION public.update_tres_poderes_updated_at();

CREATE TRIGGER update_tres_poderes_ministros_stf_updated_at
BEFORE UPDATE ON public.tres_poderes_ministros_stf
FOR EACH ROW EXECUTE FUNCTION public.update_tres_poderes_updated_at();

CREATE TRIGGER update_tres_poderes_deputados_bio_updated_at
BEFORE UPDATE ON public.tres_poderes_deputados_bio
FOR EACH ROW EXECUTE FUNCTION public.update_tres_poderes_updated_at();

CREATE TRIGGER update_tres_poderes_senadores_bio_updated_at
BEFORE UPDATE ON public.tres_poderes_senadores_bio
FOR EACH ROW EXECUTE FUNCTION public.update_tres_poderes_updated_at();

CREATE TRIGGER update_tres_poderes_config_updated_at
BEFORE UPDATE ON public.tres_poderes_config
FOR EACH ROW EXECUTE FUNCTION public.update_tres_poderes_updated_at();

-- Popular tabela de presidentes com dados iniciais
INSERT INTO public.tres_poderes_presidentes (nome, nome_completo, periodo_inicio, periodo_fim, partido, ordem) VALUES
('Deodoro da Fonseca', 'Marechal Deodoro da Fonseca', 1889, 1891, 'Militar', 1),
('Floriano Peixoto', 'Floriano Vieira Peixoto', 1891, 1894, 'Militar', 2),
('Prudente de Morais', 'Prudente José de Morais Barros', 1894, 1898, 'PRP', 3),
('Campos Sales', 'Manuel Ferraz de Campos Sales', 1898, 1902, 'PRP', 4),
('Rodrigues Alves', 'Francisco de Paula Rodrigues Alves', 1902, 1906, 'PRP', 5),
('Afonso Pena', 'Afonso Augusto Moreira Pena', 1906, 1909, 'PRM', 6),
('Nilo Peçanha', 'Nilo Procópio Peçanha', 1909, 1910, 'PRRJ', 7),
('Hermes da Fonseca', 'Hermes Rodrigues da Fonseca', 1910, 1914, 'PRC', 8),
('Venceslau Brás', 'Venceslau Brás Pereira Gomes', 1914, 1918, 'PRM', 9),
('Delfim Moreira', 'Delfim Moreira da Costa Ribeiro', 1918, 1919, 'PRM', 10),
('Epitácio Pessoa', 'Epitácio Lindolfo da Silva Pessoa', 1919, 1922, 'PRM', 11),
('Artur Bernardes', 'Artur da Silva Bernardes', 1922, 1926, 'PRM', 12),
('Washington Luís', 'Washington Luís Pereira de Sousa', 1926, 1930, 'PRP', 13),
('Getúlio Vargas', 'Getúlio Dornelles Vargas', 1930, 1945, 'PTB', 14),
('José Linhares', 'José Linhares', 1945, 1946, 'Sem partido', 15),
('Eurico Gaspar Dutra', 'Eurico Gaspar Dutra', 1946, 1951, 'PSD', 16),
('Getúlio Vargas', 'Getúlio Dornelles Vargas', 1951, 1954, 'PTB', 17),
('Café Filho', 'João Café Filho', 1954, 1955, 'PSP', 18),
('Carlos Luz', 'Carlos Coimbra da Luz', 1955, 1955, 'PSD', 19),
('Nereu Ramos', 'Nereu de Oliveira Ramos', 1955, 1956, 'PSD', 20),
('Juscelino Kubitschek', 'Juscelino Kubitschek de Oliveira', 1956, 1961, 'PSD', 21),
('Jânio Quadros', 'Jânio da Silva Quadros', 1961, 1961, 'PTN', 22),
('João Goulart', 'João Belchior Marques Goulart', 1961, 1964, 'PTB', 23),
('Castello Branco', 'Humberto de Alencar Castello Branco', 1964, 1967, 'ARENA', 24),
('Costa e Silva', 'Artur da Costa e Silva', 1967, 1969, 'ARENA', 25),
('Emílio Médici', 'Emílio Garrastazu Médici', 1969, 1974, 'ARENA', 26),
('Ernesto Geisel', 'Ernesto Beckmann Geisel', 1974, 1979, 'ARENA', 27),
('João Figueiredo', 'João Baptista de Oliveira Figueiredo', 1979, 1985, 'ARENA/PDS', 28),
('José Sarney', 'José Sarney de Araújo Costa', 1985, 1990, 'PMDB', 29),
('Fernando Collor', 'Fernando Affonso Collor de Mello', 1990, 1992, 'PRN', 30),
('Itamar Franco', 'Itamar Augusto Cautiero Franco', 1992, 1995, 'PMDB', 31),
('Fernando Henrique Cardoso', 'Fernando Henrique Cardoso', 1995, 2003, 'PSDB', 32),
('Lula', 'Luiz Inácio Lula da Silva', 2003, 2011, 'PT', 33),
('Dilma Rousseff', 'Dilma Vana Rousseff', 2011, 2016, 'PT', 34),
('Michel Temer', 'Michel Miguel Elias Temer Lulia', 2016, 2019, 'MDB', 35),
('Jair Bolsonaro', 'Jair Messias Bolsonaro', 2019, 2023, 'PL', 36),
('Lula', 'Luiz Inácio Lula da Silva', 2023, NULL, 'PT', 37);

-- Popular ministros do STF atuais
INSERT INTO public.tres_poderes_ministros_stf (nome, nome_completo, data_posse, indicado_por, ativo, ordem) VALUES
('Gilmar Mendes', 'Gilmar Ferreira Mendes', '2002-06-20', 'Fernando Henrique Cardoso', true, 1),
('Cármen Lúcia', 'Cármen Lúcia Antunes Rocha', '2006-06-21', 'Lula', true, 2),
('Dias Toffoli', 'José Antonio Dias Toffoli', '2009-10-23', 'Lula', true, 3),
('Luiz Fux', 'Luiz Fux', '2011-03-03', 'Dilma Rousseff', true, 4),
('Roberto Barroso', 'Luís Roberto Barroso', '2013-06-26', 'Dilma Rousseff', true, 5),
('Edson Fachin', 'Luiz Edson Fachin', '2015-06-16', 'Dilma Rousseff', true, 6),
('Alexandre de Moraes', 'Alexandre de Moraes', '2017-03-22', 'Michel Temer', true, 7),
('Nunes Marques', 'Kassio Nunes Marques', '2020-11-05', 'Jair Bolsonaro', true, 8),
('André Mendonça', 'André Luiz de Almeida Mendonça', '2021-12-16', 'Jair Bolsonaro', true, 9),
('Cristiano Zanin', 'Cristiano Zanin Martins', '2023-08-03', 'Lula', true, 10),
('Flávio Dino', 'Flávio Dino de Castro e Costa', '2024-02-22', 'Lula', true, 11);