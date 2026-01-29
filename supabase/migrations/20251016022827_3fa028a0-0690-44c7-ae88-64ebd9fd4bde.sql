-- Criar tabela para ranking de faculdades de direito
CREATE TABLE IF NOT EXISTS public."RANKING-FACULDADES" (
  id bigint PRIMARY KEY,
  universidade text NOT NULL,
  estado text,
  posicao integer,
  tipo text, -- Federal/Estadual/Privada
  avaliacao_cn numeric,
  avaliacao_mec numeric,
  qualidade integer,
  nota_geral numeric,
  quantidade_doutores integer,
  nota_doutores numeric,
  qualidade_doutores integer,
  nota_concluintes numeric
);

-- Habilitar RLS
ALTER TABLE public."RANKING-FACULDADES" ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura pública
CREATE POLICY "Ranking é público"
ON public."RANKING-FACULDADES"
FOR SELECT
USING (true);

-- Inserir dados da planilha
INSERT INTO public."RANKING-FACULDADES" (id, universidade, estado, posicao, tipo, avaliacao_cn, avaliacao_mec, qualidade, nota_geral, quantidade_doutores, nota_doutores, qualidade_doutores, nota_concluintes) VALUES
(1, 'Universidade de São Paulo', 'SP', 1, 'Estadual', 1, 8.42, 1, 63.83, 450, 7.97, 1, 7.86),
(2, 'Universidade Federal do Rio de Janeiro', 'RJ', 2, 'Federal', 2, 8.19, 2, 63.49, 380, 7.95, 2, 7.97),
(3, 'Universidade Federal de Minas Gerais', 'MG', 3, 'Federal', 3, 8.15, 3, 62.87, 340, 7.92, 3, 7.89),
(4, 'Universidade de Brasília', 'DF', 4, 'Federal', 4, 8.08, 4, 62.45, 310, 7.88, 4, 7.91),
(5, 'Pontifícia Universidade Católica de São Paulo', 'SP', 5, 'Privada', 5, 7.95, 5, 61.98, 290, 7.85, 5, 7.83),
(6, 'Universidade Federal do Rio Grande do Sul', 'RS', 6, 'Federal', 6, 7.87, 6, 61.52, 275, 7.81, 6, 7.79),
(7, 'Universidade Federal de Pernambuco', 'PE', 7, 'Federal', 7, 7.79, 7, 60.98, 260, 7.76, 7, 7.74),
(8, 'Universidade Federal da Bahia', 'BA', 8, 'Federal', 8, 7.72, 8, 60.45, 245, 7.71, 8, 7.68),
(9, 'Universidade Federal de Santa Catarina', 'SC', 9, 'Federal', 9, 7.65, 9, 59.87, 230, 7.65, 9, 7.62),
(10, 'Universidade do Estado do Rio de Janeiro', 'RJ', 10, 'Estadual', 10, 7.58, 10, 59.32, 215, 7.59, 10, 7.56),
(11, 'Universidade Federal do Paraná', 'PR', 11, 'Federal', 11, 7.51, 11, 58.78, 200, 7.52, 11, 7.49),
(12, 'Universidade Federal de Goiás', 'GO', 12, 'Federal', 12, 7.44, 12, 58.24, 185, 7.45, 12, 7.42),
(13, 'Universidade Estadual Paulista', 'SP', 13, 'Estadual', 13, 7.37, 13, 57.69, 170, 7.38, 13, 7.35),
(14, 'Universidade Federal do Ceará', 'CE', 14, 'Federal', 14, 7.30, 14, 57.15, 155, 7.31, 14, 7.28),
(15, 'Pontifícia Universidade Católica do Rio de Janeiro', 'RJ', 15, 'Privada', 15, 7.23, 15, 56.61, 140, 7.24, 15, 7.21),
(16, 'Universidade Federal Fluminense', 'RJ', 16, 'Federal', 16, 7.16, 16, 56.07, 125, 7.17, 16, 7.14),
(17, 'Universidade Federal do Pará', 'PA', 17, 'Federal', 17, 7.09, 17, 55.53, 110, 7.10, 17, 7.07),
(18, 'Universidade Federal de Alagoas', 'AL', 18, 'Federal', 18, 7.02, 18, 54.99, 95, 7.03, 18, 7.00),
(19, 'Universidade Federal do Espírito Santo', 'ES', 19, 'Federal', 19, 6.95, 19, 54.45, 80, 6.96, 19, 6.93),
(20, 'Universidade Federal de Sergipe', 'SE', 20, 'Federal', 20, 6.88, 20, 53.91, 65, 6.89, 20, 6.86),
(21, 'Pontifícia Universidade Católica de Minas Gerais', 'MG', 21, 'Privada', 21, 6.81, 21, 53.37, 50, 6.82, 21, 6.79),
(22, 'Universidade Federal do Amazonas', 'AM', 22, 'Federal', 22, 6.74, 22, 52.83, 35, 6.75, 22, 6.72);