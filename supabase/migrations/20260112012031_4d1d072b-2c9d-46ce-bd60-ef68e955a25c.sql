-- Criar tabela lei_seca_explicacoes
CREATE TABLE public.lei_seca_explicacoes (
  id SERIAL PRIMARY KEY,
  ordem INTEGER NOT NULL UNIQUE,
  titulo VARCHAR(255) NOT NULL,
  descricao_curta TEXT,
  conteudo_gerado TEXT,
  url_capa TEXT,
  url_audio TEXT,
  cache_validade TIMESTAMP WITH TIME ZONE,
  gerado_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Habilitar RLS
ALTER TABLE public.lei_seca_explicacoes ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública
CREATE POLICY "Leitura pública das explicações" 
ON public.lei_seca_explicacoes 
FOR SELECT 
USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_lei_seca_explicacoes_updated_at
BEFORE UPDATE ON public.lei_seca_explicacoes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir os 30 artigos educativos
INSERT INTO public.lei_seca_explicacoes (ordem, titulo, descricao_curta) VALUES
(1, 'O que é uma Lei?', 'Entenda o conceito fundamental de lei, sua origem, finalidade e importância no ordenamento jurídico brasileiro.'),
(2, 'Hierarquia das Leis no Brasil', 'Conheça a pirâmide normativa brasileira e como as leis se organizam hierarquicamente.'),
(3, 'O que é a Constituição Federal?', 'A lei maior do Brasil: sua história, estrutura e papel como fundamento de todo o sistema jurídico.'),
(4, 'O que são Leis Complementares?', 'Descubra quando e por que o legislador utiliza leis complementares e como elas se diferenciam das ordinárias.'),
(5, 'O que são Leis Ordinárias?', 'O tipo mais comum de lei no Brasil: processo de criação, quórum e exemplos práticos.'),
(6, 'O que são Medidas Provisórias?', 'Entenda esse instrumento legislativo do Presidente: requisitos, prazos e conversão em lei.'),
(7, 'O que são Decretos?', 'Atos normativos do Poder Executivo: decretos regulamentares, autônomos e suas diferenças.'),
(8, 'O que são Portarias e Resoluções?', 'Atos administrativos infralegais: quem pode editar, alcance e hierarquia normativa.'),
(9, 'Processo Legislativo: Como nasce uma Lei?', 'Da iniciativa à publicação: todas as etapas que uma lei percorre até entrar em vigor.'),
(10, 'Quem pode propor Leis no Brasil?', 'Iniciativa legislativa: Presidente, deputados, senadores, cidadãos e outros legitimados.'),
(11, 'O que é Sanção Presidencial?', 'A aprovação formal do Presidente: prazo, consequências e diferença para promulgação.'),
(12, 'O que é Veto e quem pode Vetar?', 'O poder de rejeição do Executivo: veto total, parcial, motivações e como o Congresso pode derrubar.'),
(13, 'O que é Promulgação e Publicação?', 'Os atos finais do processo legislativo: quem promulga, onde se publica e quando a lei nasce.'),
(14, 'O que é o Diário Oficial da União?', 'O jornal oficial do governo: histórico, estrutura, como acessar e sua importância jurídica.'),
(15, 'O que é um Artigo de Lei?', 'A unidade básica do texto legal: estrutura, numeração e como ler corretamente.'),
(16, 'O que são Parágrafos (§)?', 'Subdivisões do artigo: parágrafo único, parágrafos numerados e sua função no texto legal.'),
(17, 'O que são Incisos?', 'Enumerações dentro de artigos e parágrafos: formato, leitura e exemplos práticos.'),
(18, 'O que são Alíneas?', 'O menor nível de subdivisão legal: quando aparecem, como identificar e interpretar.'),
(19, 'Abreviações Jurídicas Essenciais', 'CF, CP, CPC, CLT, art., §, inc., al.: domine as siglas mais usadas na legislação.'),
(20, 'O que é Vacatio Legis?', 'O período de espera antes da lei vigorar: regra geral, exceções e cálculo do prazo.'),
(21, 'O que é Revogação de Lei?', 'Quando e como uma lei deixa de existir: conceito, tipos e efeitos jurídicos.'),
(22, 'Revogação Expressa vs Tácita', 'As duas formas de revogar leis: diferenças, identificação e consequências práticas.'),
(23, 'O que é Derrogação e Ab-rogação?', 'Revogação parcial e total: conceitos, exemplos e como identificar no texto legal.'),
(24, 'O que é uma Emenda Constitucional?', 'Como alterar a Constituição: PEC, quórum qualificado, limites e cláusulas pétreas.'),
(25, 'O que é Súmula e Súmula Vinculante?', 'Jurisprudência consolidada: diferenças, quem edita e efeito vinculante no Judiciário.'),
(26, 'O que é Jurisprudência?', 'Decisões reiteradas dos tribunais: importância, força normativa e como pesquisar.'),
(27, 'Sites Oficiais de Legislação', 'Planalto, LegisWeb, Senado, Câmara: os melhores portais para consultar leis gratuitamente.'),
(28, 'Como Pesquisar Leis Corretamente', 'Técnicas de busca, filtros, operadores e dicas para encontrar rapidamente o que precisa.'),
(29, 'O que é um Vade Mecum?', 'Origem do termo, tipos de Vade Mecum, digital vs físico e como escolher o ideal.'),
(30, 'Como Estudar Legislação de Forma Eficiente', 'Métodos de estudo, leitura ativa, fichamento e técnicas de memorização para concursos.');