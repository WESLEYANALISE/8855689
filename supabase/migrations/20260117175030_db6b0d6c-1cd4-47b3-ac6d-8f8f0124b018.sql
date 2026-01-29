-- Tabela de matérias de conceitos (espelhando faculdade_disciplinas)
CREATE TABLE public.conceitos_materias (
  id SERIAL PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  area TEXT NOT NULL,
  area_ordem INTEGER NOT NULL,
  carga_horaria INTEGER DEFAULT 0,
  ementa TEXT,
  url_fonte TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de tópicos de conceitos (espelhando faculdade_topicos)
CREATE TABLE public.conceitos_topicos (
  id SERIAL PRIMARY KEY,
  materia_id INTEGER REFERENCES public.conceitos_materias(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL,
  titulo TEXT NOT NULL,
  complemento TEXT,
  conteudo_gerado TEXT,
  exemplos JSONB,
  termos JSONB,
  flashcards JSONB,
  questoes JSONB,
  status TEXT DEFAULT 'pendente',
  capa_url TEXT,
  url_narracao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.conceitos_materias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conceitos_topicos ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura pública
CREATE POLICY "Permitir leitura publica conceitos_materias" ON public.conceitos_materias FOR SELECT USING (true);
CREATE POLICY "Permitir leitura publica conceitos_topicos" ON public.conceitos_topicos FOR SELECT USING (true);

-- Políticas de escrita para service role
CREATE POLICY "Service role pode inserir conceitos_materias" ON public.conceitos_materias FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role pode atualizar conceitos_materias" ON public.conceitos_materias FOR UPDATE USING (true);
CREATE POLICY "Service role pode inserir conceitos_topicos" ON public.conceitos_topicos FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role pode atualizar conceitos_topicos" ON public.conceitos_topicos FOR UPDATE USING (true);

-- Índices para performance
CREATE INDEX idx_conceitos_materias_area ON public.conceitos_materias(area_ordem);
CREATE INDEX idx_conceitos_topicos_materia ON public.conceitos_topicos(materia_id);
CREATE INDEX idx_conceitos_topicos_status ON public.conceitos_topicos(status);

-- =============================================
-- ÁREA 1: HISTÓRIA DO DIREITO (4 matérias)
-- =============================================

INSERT INTO public.conceitos_materias (codigo, nome, area, area_ordem, carga_horaria, ementa, url_fonte) VALUES
('HIST001', 'História do Direito', 'História do Direito', 1, 14, 'Estudo da evolução histórica do direito desde as civilizações antigas até a contemporaneidade', 'https://trilhante.com.br/trilha/iniciando-no-mundo-do-direito'),
('HIST002', 'Direito Romano', 'História do Direito', 1, 28, 'Estudo aprofundado do sistema jurídico romano e sua influência no direito moderno', 'https://trilhante.com.br/trilha/iniciando-no-mundo-do-direito'),
('HIST003', 'História Constitucional do Brasil', 'História do Direito', 1, 20, 'Evolução das constituições brasileiras desde o Império até a CF/88', 'https://trilhante.com.br/trilha/iniciando-no-mundo-do-direito'),
('HIST004', 'A Formação do Capitalismo', 'História do Direito', 1, 10, 'Relação entre o desenvolvimento econômico e a evolução do direito', 'https://trilhante.com.br/trilha/iniciando-no-mundo-do-direito');

-- =============================================
-- ÁREA 2: FUNDAMENTOS DO DIREITO (4 matérias)
-- =============================================

INSERT INTO public.conceitos_materias (codigo, nome, area, area_ordem, carga_horaria, ementa, url_fonte) VALUES
('FUND001', 'Iniciando no Mundo do Direito', 'Fundamentos do Direito', 2, 11, 'Conceitos básicos e introdutórios para quem está começando nos estudos jurídicos', 'https://trilhante.com.br/trilha/iniciando-no-mundo-do-direito'),
('FUND002', 'Introdução ao Estudo do Direito', 'Fundamentos do Direito', 2, 24, 'Fundamentos teóricos do direito: norma, fontes, interpretação e aplicação', 'https://trilhante.com.br/trilha/iniciando-no-mundo-do-direito'),
('FUND003', 'LINDB - Lei de Introdução às Normas', 'Fundamentos do Direito', 2, 19, 'Estudo completo da Lei de Introdução às Normas do Direito Brasileiro', 'https://trilhante.com.br/trilha/iniciando-no-mundo-do-direito'),
('FUND004', 'Teoria Geral dos Prazos', 'Fundamentos do Direito', 2, 13, 'Contagem de prazos, prescrição, decadência e preclusão', 'https://trilhante.com.br/trilha/iniciando-no-mundo-do-direito');

-- =============================================
-- ÁREA 3: FILOSOFIA E SOCIOLOGIA (3 matérias)
-- =============================================

INSERT INTO public.conceitos_materias (codigo, nome, area, area_ordem, carga_horaria, ementa, url_fonte) VALUES
('FILO001', 'Filosofia do Direito', 'Filosofia e Sociologia', 3, 20, 'Correntes filosóficas e sua aplicação no pensamento jurídico', 'https://trilhante.com.br/trilha/iniciando-no-mundo-do-direito'),
('FILO002', 'Hans Kelsen e a Teoria Pura', 'Filosofia e Sociologia', 3, 26, 'Estudo aprofundado do positivismo jurídico kelseniano', 'https://trilhante.com.br/trilha/iniciando-no-mundo-do-direito'),
('FILO003', 'Introdução à Sociologia do Direito', 'Filosofia e Sociologia', 3, 31, 'Relação entre direito e sociedade, controle social e mudança social', 'https://trilhante.com.br/trilha/iniciando-no-mundo-do-direito');

-- =============================================
-- ÁREA 4: DIREITO CONSTITUCIONAL BÁSICO (2 matérias)
-- =============================================

INSERT INTO public.conceitos_materias (codigo, nome, area, area_ordem, carga_horaria, ementa, url_fonte) VALUES
('CONST001', 'Constitucionalismo e Classificação das Constituições', 'Direito Constitucional Básico', 4, 21, 'História do constitucionalismo e tipos de constituições', 'https://trilhante.com.br/trilha/iniciando-no-mundo-do-direito'),
('CONST002', 'Teoria Geral dos Direitos Humanos', 'Direito Constitucional Básico', 4, 18, 'Fundamentos, gerações e sistema de proteção dos direitos humanos', 'https://trilhante.com.br/trilha/iniciando-no-mundo-do-direito');

-- =============================================
-- ÁREA 5: DIREITO CIVIL E PENAL BÁSICO (3 matérias)
-- =============================================

INSERT INTO public.conceitos_materias (codigo, nome, area, area_ordem, carga_horaria, ementa, url_fonte) VALUES
('CIVIL001', 'Pessoas no Código Civil', 'Direito Civil e Penal Básico', 5, 27, 'Personalidade, capacidade, direitos da personalidade e pessoas jurídicas', 'https://trilhante.com.br/trilha/iniciando-no-mundo-do-direito'),
('CIVIL002', 'Direitos da Personalidade', 'Direito Civil e Penal Básico', 5, 21, 'Proteção à vida, integridade, honra, imagem e privacidade', 'https://trilhante.com.br/trilha/iniciando-no-mundo-do-direito'),
('PENAL001', 'Noções Gerais de Direito Penal', 'Direito Civil e Penal Básico', 5, 30, 'Princípios, teoria do crime, tipicidade e antijuridicidade', 'https://trilhante.com.br/trilha/iniciando-no-mundo-do-direito');

-- =============================================
-- TÓPICOS - ÁREA 1: HISTÓRIA DO DIREITO
-- =============================================

-- História do Direito (matéria 1)
INSERT INTO public.conceitos_topicos (materia_id, ordem, titulo, complemento) VALUES
(1, 1, 'Surgimento do Direito', 'Origens do direito nas civilizações antigas, Código de Hamurabi e primeiras normas escritas'),
(1, 2, 'O Direito na Grécia Antiga', 'Sistema jurídico grego, democracia ateniense e contribuições filosóficas de Platão e Aristóteles'),
(1, 3, 'O Direito em Roma', 'Instituições romanas, períodos históricos e principais jurisconsultos'),
(1, 4, 'O Direito na Idade Média', 'Direito canônico, feudalismo, glosadores e pós-glosadores'),
(1, 5, 'O Direito na Idade Moderna', 'Iluminismo, codificação napoleônica e transformações jurídicas'),
(1, 6, 'O Direito na Idade Contemporânea', 'Estado de direito, constitucionalismo e direitos humanos'),
(1, 7, 'Revisão Geral de História do Direito', 'Consolidação dos principais conceitos e evolução histórica');

-- Direito Romano (matéria 2)
INSERT INTO public.conceitos_topicos (materia_id, ordem, titulo, complemento) VALUES
(2, 1, 'Introdução ao Direito Romano', 'Fontes do direito romano, períodos históricos e características gerais'),
(2, 2, 'Direito das Pessoas em Roma', 'Status libertatis, civitatis e familiae; capacidade jurídica romana'),
(2, 3, 'Direito das Coisas Romano', 'Propriedade quiritária, posse, usucapião e direitos reais'),
(2, 4, 'Direito das Obrigações', 'Contratos, delitos, quase-contratos e fontes obrigacionais'),
(2, 5, 'Direito de Família Romano', 'Patria potestas, casamento, dote e tutela'),
(2, 6, 'Direito das Sucessões em Roma', 'Testamento, herança, legados e fideicomisso'),
(2, 7, 'Processo Civil Romano', 'Legis actiones, processo formulário e cognitio extra ordinem'),
(2, 8, 'Legado do Direito Romano', 'Influência no direito civil moderno e recepção do direito romano');

-- História Constitucional do Brasil (matéria 3)
INSERT INTO public.conceitos_topicos (materia_id, ordem, titulo, complemento) VALUES
(3, 1, 'Período Colonial e Independência', 'Ordenações do Reino e processo de independência'),
(3, 2, 'Constituição Imperial de 1824', 'Poder Moderador, características e vigência'),
(3, 3, 'Constituição Republicana de 1891', 'Federalismo, presidencialismo e influência americana'),
(3, 4, 'Era Vargas e as Constituições de 1934 e 1937', 'Direitos sociais, Estado Novo e autoritarismo'),
(3, 5, 'Constituição de 1946 e Período Democrático', 'Redemocratização e características liberais'),
(3, 6, 'Constituição de 1988 - Constituição Cidadã', 'Direitos fundamentais, organização do Estado e garantias constitucionais');

-- A Formação do Capitalismo (matéria 4)
INSERT INTO public.conceitos_topicos (materia_id, ordem, titulo, complemento) VALUES
(4, 1, 'Origens do Capitalismo', 'Transição do feudalismo, acumulação primitiva e mercantilismo'),
(4, 2, 'Revolução Industrial e Direito', 'Transformações econômicas e surgimento do direito do trabalho'),
(4, 3, 'Capitalismo Liberal e Estado Mínimo', 'Liberalismo econômico, propriedade privada e contratos'),
(4, 4, 'Estado Social e Direito Econômico', 'Welfare state, intervenção estatal e direitos sociais');

-- =============================================
-- TÓPICOS - ÁREA 2: FUNDAMENTOS DO DIREITO
-- =============================================

-- Iniciando no Mundo do Direito (matéria 5)
INSERT INTO public.conceitos_topicos (materia_id, ordem, titulo, complemento) VALUES
(5, 1, 'O que é o Direito?', 'Conceito, finalidades e natureza do fenômeno jurídico'),
(5, 2, 'Direito Objetivo e Direito Subjetivo', 'Distinção entre norma jurídica e faculdade de agir'),
(5, 3, 'Ramos do Direito', 'Divisão entre direito público e privado, principais áreas'),
(5, 4, 'Fontes do Direito Brasileiro', 'Lei, costume, jurisprudência, doutrina e princípios gerais'),
(5, 5, 'Carreiras Jurídicas', 'Magistratura, Ministério Público, Advocacia, Defensoria e outras');

-- Introdução ao Estudo do Direito (matéria 6)
INSERT INTO public.conceitos_topicos (materia_id, ordem, titulo, complemento) VALUES
(6, 1, 'Origem e Evolução do Direito', 'Desenvolvimento histórico e formação dos sistemas jurídicos'),
(6, 2, 'Perfil Histórico da Ciência do Direito', 'Escolas jurídicas e evolução do pensamento'),
(6, 3, 'Dogmática Jurídica', 'Método dogmático, sistematização e ciência do direito'),
(6, 4, 'A Norma Jurídica', 'Estrutura, características e classificação das normas'),
(6, 5, 'Validade, Vigência e Eficácia', 'Planos de existência da norma jurídica'),
(6, 6, 'Fontes do Direito', 'Fontes formais e materiais, hierarquia normativa'),
(6, 7, 'Interpretação do Direito', 'Métodos interpretativos: literal, lógico, sistemático, teleológico'),
(6, 8, 'Integração do Direito', 'Lacunas, analogia, costumes e princípios gerais'),
(6, 9, 'Antinomias Jurídicas', 'Conflitos de normas e critérios de solução'),
(6, 10, 'Relação Jurídica', 'Elementos: sujeito, objeto e vínculo jurídico'),
(6, 11, 'Fato Jurídico', 'Classificação dos fatos jurídicos e efeitos'),
(6, 12, 'Direito e Justiça', 'Teorias da justiça e sua relação com o direito');

-- LINDB (matéria 7)
INSERT INTO public.conceitos_topicos (materia_id, ordem, titulo, complemento) VALUES
(7, 1, 'Introdução à LINDB', 'Histórico, natureza e função da Lei de Introdução'),
(7, 2, 'Vigência das Leis', 'Início da obrigatoriedade, vacatio legis e conhecimento da lei'),
(7, 3, 'Aplicação da Lei no Tempo', 'Irretroatividade, direito adquirido, ato jurídico perfeito e coisa julgada'),
(7, 4, 'Aplicação da Lei no Espaço', 'Territorialidade, extraterritorialidade e estatuto pessoal'),
(7, 5, 'Interpretação e Integração', 'Regras de interpretação e preenchimento de lacunas na LINDB'),
(7, 6, 'Normas de Direito Público na LINDB', 'Segurança jurídica, boa-fé e alterações recentes');

-- Teoria Geral dos Prazos (matéria 8)
INSERT INTO public.conceitos_topicos (materia_id, ordem, titulo, complemento) VALUES
(8, 1, 'Introdução aos Prazos', 'Conceito, natureza e importância dos prazos no direito'),
(8, 2, 'Contagem de Prazos', 'Regras de contagem, dies a quo e dies ad quem'),
(8, 3, 'Prescrição', 'Conceito, prazos prescricionais e causas de suspensão e interrupção'),
(8, 4, 'Decadência', 'Distinção da prescrição, prazos decadenciais e efeitos'),
(8, 5, 'Preclusão', 'Tipos de preclusão: temporal, consumativa e lógica');

-- =============================================
-- TÓPICOS - ÁREA 3: FILOSOFIA E SOCIOLOGIA
-- =============================================

-- Filosofia do Direito (matéria 9)
INSERT INTO public.conceitos_topicos (materia_id, ordem, titulo, complemento) VALUES
(9, 1, 'Introdução à Filosofia do Direito', 'Objeto, método e importância da reflexão filosófica sobre o direito'),
(9, 2, 'Jusnaturalismo Clássico', 'Direito natural em Aristóteles, Cícero e Santo Tomás de Aquino'),
(9, 3, 'Jusnaturalismo Moderno', 'Grotius, Hobbes, Locke e Rousseau - contrato social'),
(9, 4, 'Positivismo Jurídico', 'Escola da Exegese, Escola Histórica e positivismo normativista'),
(9, 5, 'Realismo Jurídico', 'Realismo americano e escandinavo, direito como fato'),
(9, 6, 'Teoria Crítica do Direito', 'Marxismo jurídico e teorias críticas contemporâneas'),
(9, 7, 'Neoconstitucionalismo', 'Força normativa da Constituição e ponderação de princípios'),
(9, 8, 'Hermenêutica Jurídica', 'Gadamer, Habermas e a virada hermenêutica'),
(9, 9, 'Teorias da Argumentação Jurídica', 'Perelman, Alexy e a teoria da argumentação'),
(9, 10, 'Ética e Direito', 'Relações entre moral e direito, mínimo ético');

-- Hans Kelsen (matéria 10)
INSERT INTO public.conceitos_topicos (materia_id, ordem, titulo, complemento) VALUES
(10, 1, 'Vida e Obra de Hans Kelsen', 'Contexto histórico, formação e principais obras'),
(10, 2, 'A Teoria Pura do Direito', 'Pureza metodológica, separação do direito e moral'),
(10, 3, 'Norma Fundamental', 'Grundnorm, validade e hierarquia normativa'),
(10, 4, 'Estrutura Escalonada do Ordenamento', 'Pirâmide normativa e dinâmica jurídica'),
(10, 5, 'Interpretação em Kelsen', 'Moldura interpretativa e discricionariedade judicial'),
(10, 6, 'Críticas e Legado de Kelsen', 'Debate Hart-Kelsen e influência no direito contemporâneo');

-- Introdução à Sociologia do Direito (matéria 11)
INSERT INTO public.conceitos_topicos (materia_id, ordem, titulo, complemento) VALUES
(11, 1, 'O que é Sociologia do Direito?', 'Objeto, método e relação com a dogmática jurídica'),
(11, 2, 'Clássicos da Sociologia Jurídica', 'Durkheim, Weber e Marx sobre o direito'),
(11, 3, 'Controle Social e Direito', 'Função do direito no controle e organização social'),
(11, 4, 'Direito e Mudança Social', 'O direito como instrumento de transformação'),
(11, 5, 'Pluralismo Jurídico', 'Direito estatal e ordens jurídicas não-estatais'),
(11, 6, 'Acesso à Justiça', 'Obstáculos e democratização do acesso ao judiciário'),
(11, 7, 'Sociologia das Profissões Jurídicas', 'Magistratura, advocacia e formação jurídica');

-- =============================================
-- TÓPICOS - ÁREA 4: DIREITO CONSTITUCIONAL BÁSICO
-- =============================================

-- Constitucionalismo e Classificação das Constituições (matéria 12)
INSERT INTO public.conceitos_topicos (materia_id, ordem, titulo, complemento) VALUES
(12, 1, 'História do Constitucionalismo', 'Origens, Magna Carta, revoluções liberais e evolução'),
(12, 2, 'Constitucionalismo Antigo e Medieval', 'Limitações ao poder na antiguidade e idade média'),
(12, 3, 'Constitucionalismo Moderno', 'Revoluções americana e francesa, declarações de direitos'),
(12, 4, 'Constitucionalismo Contemporâneo', 'Neoconstitucionalismo e força normativa da Constituição'),
(12, 5, 'Classificação das Constituições', 'Quanto à origem, forma, extensão, modo de elaboração'),
(12, 6, 'Classificação da CF/88', 'Características da Constituição brasileira vigente');

-- Teoria Geral dos Direitos Humanos (matéria 13)
INSERT INTO public.conceitos_topicos (materia_id, ordem, titulo, complemento) VALUES
(13, 1, 'Fundamentos dos Direitos Humanos', 'Conceito, características e fundamentos filosóficos'),
(13, 2, 'Gerações/Dimensões dos Direitos', 'Primeira, segunda, terceira e novas gerações'),
(13, 3, 'Sistema Global de Proteção', 'ONU, Declaração Universal e tratados internacionais'),
(13, 4, 'Sistema Regional Interamericano', 'OEA, Convenção Americana e Corte Interamericana'),
(13, 5, 'Direitos Humanos no Brasil', 'Incorporação dos tratados e hierarquia normativa');

-- =============================================
-- TÓPICOS - ÁREA 5: DIREITO CIVIL E PENAL BÁSICO
-- =============================================

-- Pessoas no Código Civil (matéria 14)
INSERT INTO public.conceitos_topicos (materia_id, ordem, titulo, complemento) VALUES
(14, 1, 'Personalidade Jurídica', 'Início e término da personalidade, nascituro'),
(14, 2, 'Capacidade Civil', 'Capacidade de direito e de fato, incapacidades'),
(14, 3, 'Emancipação', 'Formas de emancipação e efeitos jurídicos'),
(14, 4, 'Direitos da Personalidade no CC', 'Previsão legal, características e proteção'),
(14, 5, 'Nome Civil', 'Elementos, alteração e proteção do nome'),
(14, 6, 'Estado Civil', 'Tipos de estado e registro civil'),
(14, 7, 'Domicílio', 'Conceito, espécies e mudança de domicílio'),
(14, 8, 'Pessoas Jurídicas', 'Conceito, classificação e desconsideração da personalidade');

-- Direitos da Personalidade (matéria 15)
INSERT INTO public.conceitos_topicos (materia_id, ordem, titulo, complemento) VALUES
(15, 1, 'Teoria Geral dos Direitos da Personalidade', 'Conceito, natureza e características'),
(15, 2, 'Direito à Vida e Integridade Física', 'Proteção constitucional e limites'),
(15, 3, 'Direito à Honra', 'Honra subjetiva e objetiva, tutela jurídica'),
(15, 4, 'Direito à Imagem', 'Uso indevido da imagem e responsabilidade'),
(15, 5, 'Direito à Privacidade', 'Vida privada, intimidade e proteção de dados');

-- Noções Gerais de Direito Penal (matéria 16)
INSERT INTO public.conceitos_topicos (materia_id, ordem, titulo, complemento) VALUES
(16, 1, 'Introdução ao Direito Penal', 'Conceito, função e relação com outros ramos'),
(16, 2, 'Princípios do Direito Penal', 'Legalidade, anterioridade, culpabilidade, proporcionalidade'),
(16, 3, 'Aplicação da Lei Penal', 'Tempo e lugar do crime, territorialidade'),
(16, 4, 'Teoria do Crime', 'Conceito analítico: fato típico, ilícito e culpável'),
(16, 5, 'Tipicidade', 'Tipo penal, tipicidade formal e material'),
(16, 6, 'Ilicitude e Excludentes', 'Antijuridicidade, legítima defesa, estado de necessidade'),
(16, 7, 'Culpabilidade', 'Imputabilidade, consciência da ilicitude e exigibilidade');