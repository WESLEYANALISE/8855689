-- =====================================================
-- 5º SEMESTRE - FACULDADE DE DIREITO USP (Grade 2014)
-- =====================================================

-- 1. DCO0321 - Concorrência e Mercado
INSERT INTO faculdade_disciplinas (codigo, nome, nome_ingles, departamento, semestre, carga_horaria, ementa, objetivos, url_jupiter, ativo)
VALUES (
  'DCO0321',
  'Concorrência e Mercado',
  'Competition and Market',
  'Direito Comercial',
  5,
  30,
  'Estudo do direito concorrencial brasileiro, abordando a disciplina jurídica da concorrência, controle de concentrações e condutas anticompetitivas.',
  'Capacitar o aluno a compreender o sistema brasileiro de defesa da concorrência e suas interfaces com a regulação econômica.',
  'https://uspdigital.usp.br/jupiterweb/obterDisciplina?sgldis=DCO0321',
  true
);

-- 2. DCV0313 - Fontes das Obrigações
INSERT INTO faculdade_disciplinas (codigo, nome, nome_ingles, departamento, semestre, carga_horaria, ementa, objetivos, url_jupiter, ativo)
VALUES (
  'DCV0313',
  'Fontes das Obrigações: Responsabilidade Civil, Atos Unilaterais e Outras Fontes',
  'Sources of Obligations: Civil Liability, Unilateral Acts and Other Sources',
  'Direito Civil',
  5,
  30,
  'Estudo das fontes das obrigações além do contrato, incluindo atos unilaterais, enriquecimento sem causa e responsabilidade civil.',
  'Proporcionar ao aluno conhecimento aprofundado sobre responsabilidade civil e demais fontes das obrigações.',
  'https://uspdigital.usp.br/jupiterweb/obterDisciplina?sgldis=DCV0313',
  true
);

-- 3. DFD0313 - Filosofia do Direito I
INSERT INTO faculdade_disciplinas (codigo, nome, nome_ingles, departamento, semestre, carga_horaria, ementa, objetivos, url_jupiter, ativo)
VALUES (
  'DFD0313',
  'Filosofia do Direito I (Parte Geral)',
  'Philosophy of Law I (General Part)',
  'Filosofia e Teoria Geral do Direito',
  5,
  60,
  'Introdução à filosofia do direito, abordando sua história desde a antiguidade até o pensamento contemporâneo.',
  'Desenvolver a capacidade de reflexão crítica sobre os fundamentos filosóficos do direito.',
  'https://uspdigital.usp.br/jupiterweb/obterDisciplina?sgldis=DFD0313',
  true
);

-- 4. DIN0315 - Direito Internacional Público
INSERT INTO faculdade_disciplinas (codigo, nome, nome_ingles, departamento, semestre, carga_horaria, ementa, objetivos, url_jupiter, ativo)
VALUES (
  'DIN0315',
  'Direito Internacional Público',
  'Public International Law',
  'Direito Internacional e Comparado',
  5,
  60,
  'Estudo sistemático do direito internacional público, suas fontes, sujeitos, organizações internacionais e solução de controvérsias.',
  'Capacitar o aluno a compreender e aplicar as normas de direito internacional público.',
  'https://uspdigital.usp.br/jupiterweb/obterDisciplina?sgldis=DIN0315',
  true
);

-- 5. DPC0319 - Direito Processual Civil II
INSERT INTO faculdade_disciplinas (codigo, nome, nome_ingles, departamento, semestre, carga_horaria, ementa, objetivos, url_jupiter, ativo)
VALUES (
  'DPC0319',
  'Direito Processual Civil II: Procedimento Comum II',
  'Civil Procedural Law II: Common Procedure II',
  'Direito Processual',
  5,
  60,
  'Continuação do estudo do procedimento comum, abordando teoria da prova, sentença, coisa julgada e sujeitos processuais.',
  'Aprofundar o conhecimento sobre o procedimento comum no processo civil brasileiro.',
  'https://uspdigital.usp.br/jupiterweb/obterDisciplina?sgldis=DPC0319',
  true
);

-- 6. DTB0327 - Direito do Trabalho I
INSERT INTO faculdade_disciplinas (codigo, nome, nome_ingles, departamento, semestre, carga_horaria, ementa, objetivos, url_jupiter, ativo)
VALUES (
  'DTB0327',
  'Direito do Trabalho I',
  'Labor Law I',
  'Direito do Trabalho e da Seguridade Social',
  5,
  60,
  'Estudo dos fundamentos do direito do trabalho, relação de emprego, sujeitos, modalidades contratuais e condições de trabalho.',
  'Proporcionar ao aluno conhecimento sobre os institutos fundamentais do direito individual do trabalho.',
  'https://uspdigital.usp.br/jupiterweb/obterDisciplina?sgldis=DTB0327',
  true
);

-- =====================================================
-- TÓPICOS DAS DISCIPLINAS DO 5º SEMESTRE
-- =====================================================

-- Tópicos de DCO0321 - Concorrência e Mercado (14 tópicos)
INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 1, 'Histórico da disciplina jurídica da concorrência', 'História crítica dos monopólios. A formação dos monopólios e a sua internacionalização', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DCO0321';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 2, 'Direito Concorrencial: as várias concepções e sua superação', 'Resultados econômicos vs. valores jurídicos. Alternativa: estruturalismo jurídico e teoria jurídica do poder econômico', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DCO0321';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 3, 'Dimensão constitucional da defesa da concorrência', 'Características e princípios da legislação concorrencial no Brasil', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DCO0321';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 4, 'Interesses protegidos e "pontes entre legislações"', 'Objetivos da defesa da concorrência', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DCO0321';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 5, 'Poder econômico: configuração e controle', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DCO0321';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 6, 'Mercado relevante: significado e delimitação', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DCO0321';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 7, 'Controle de concentrações: dinâmica e critérios de análise', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DCO0321';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 8, 'Acordo em atos de concentração', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DCO0321';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 9, 'Controle de condutas', 'Condutas horizontais, predatórias e verticais', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DCO0321';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 10, 'Cartel em licitações', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DCO0321';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 11, 'Programa de leniência e termo de cessação de conduta', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DCO0321';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 12, 'Jurisdição da defesa da concorrência', 'Revisão judicial de decisões administrativas e responsabilidade civil concorrencial', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DCO0321';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 13, 'Regulação e antitruste: pontos de interação e de distanciamento', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DCO0321';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 14, 'Direito Concorrencial e Propriedade Industrial', 'Interfaces', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DCO0321';

-- Tópicos de DCV0313 - Fontes das Obrigações (26 tópicos)
INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 1, 'Promessa de recompensa', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DCV0313';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 2, 'Gestão de negócios', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DCV0313';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 3, 'Pagamento indevido', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DCV0313';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 4, 'Enriquecimento sem causa', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DCV0313';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 5, 'Conceito de responsabilidade civil', 'Responsabilidade civil e responsabilidade penal. Responsabilidade contratual e extracontratual', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DCV0313';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 6, 'Evolução da responsabilidade civil', 'Responsabilidade subjetiva e objetiva. Da culpa ao risco', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DCV0313';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 7, 'Pressupostos da responsabilidade civil', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DCV0313';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 8, 'O dano', 'Dano direto e indireto. Dano material e extrapatrimonial. Dano estético. Dano coletivo', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DCV0313';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 9, 'Nexo de causalidade', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DCV0313';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 10, 'Dolo e culpa', 'Graus de culpa. Risco e outros nexos de imputação. A responsabilidade civil pelo risco da atividade', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DCV0313';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 11, 'As excludentes da responsabilidade civil', 'Do caso fortuito e de força maior. Da cláusula de não indenizar. Da assunção do risco pelo devedor', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DCV0313';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 12, 'A responsabilidade civil decorrente dos atos abusivos do Direito', 'Os atos causadores de dano que não são considerados ilícitos', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DCV0313';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 13, 'Responsabilidade por fato próprio', 'Imputabilidade. Capacidade e responsabilidade', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DCV0313';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 14, 'Responsabilidade civil na cobrança de dívidas', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DCV0313';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 15, 'Responsabilidade civil da pessoa jurídica de direito público', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DCV0313';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 16, 'Responsabilidade por fato de terceiro', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DCV0313';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 17, 'A responsabilidade dos pais pelos atos dos filhos', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DCV0313';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 18, 'Responsabilidade do empregador e do preponente', 'Pelos atos dos empregados e prepostos', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DCV0313';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 19, 'Responsabilidade pelo fato da coisa', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DCV0313';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 20, 'Responsabilidade pela ruína dos edifícios', 'Responsabilidade pelos objetos deles despejados', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DCV0313';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 21, 'Responsabilidade pelo fato dos animais', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DCV0313';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 22, 'Responsabilidade civil dos médicos', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DCV0313';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 23, 'Responsabilidade civil dos bancos', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DCV0313';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 24, 'Responsabilidade civil dos hotéis', 'A hospedagem gratuita', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DCV0313';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 25, 'Responsabilidade civil do construtor', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DCV0313';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 26, 'Responsabilidade do transportador e do produtor', 'Pelo fato do produto', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DCV0313';

-- Tópicos de DFD0313 - Filosofia do Direito I (7 tópicos)
INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 1, 'Filosofia e Filosofia do Direito', 'Direito como objeto da Filosofia. O papel da Filosofia do Direito', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DFD0313';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 2, 'A História da Filosofia do Direito', 'Sua evolução e suas divisões didático-sistemáticas', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DFD0313';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 3, 'A Filosofia do Direito Antiga', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DFD0313';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 4, 'A Filosofia do Direito Medieval', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DFD0313';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 5, 'A Filosofia do Direito Moderna', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DFD0313';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 6, 'A Filosofia do Direito Contemporânea', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DFD0313';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 7, 'Os horizontes do pensamento jurídico contemporâneo', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DFD0313';

-- Tópicos de DIN0315 - Direito Internacional Público (35 tópicos)
INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 1, 'Introdução: noção, objeto e método do direito internacional', 'Definição e denominação', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DIN0315';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 2, 'Desenvolvimento histórico do direito internacional', 'De Vitória a Grócio até Vestfália (1648)', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DIN0315';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 3, 'De Vestfália (1648) até Viena (1815)', 'Os clássicos: Pufendorf, Bynkershoek, Wolff e Vattel', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DIN0315';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 4, 'De Viena (1815) até Versalhes (1919) e o contexto presente', 'Perspectivas no século XXI', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DIN0315';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 5, 'Fundamento e normas cogentes de direito internacional (jus cogens)', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DIN0315';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 6, 'Fontes do direito internacional: costume internacional', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DIN0315';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 7, 'Tratados: conceito, terminologia, classificação e condição de validade', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DIN0315';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 8, 'Ratificação, adesão, aceitação, registro e publicação de tratados', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DIN0315';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 9, 'Interpretação de tratados', 'Tratados sucessivos sobre a mesma matéria', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DIN0315';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 10, 'Nulidade, extinção e suspensão de aplicação de tratados', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DIN0315';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 11, 'Princípios gerais do direito, jurisprudência e doutrina como fontes', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DIN0315';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 12, 'Equidade, resoluções de organizações internacionais e atos unilaterais dos Estados', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DIN0315';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 13, 'Codificação do direito internacional', 'Convenções de Viena sobre relações diplomáticas e consulares', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DIN0315';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 14, 'Relações do direito internacional com o direito interno', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DIN0315';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 15, 'Estado como sujeito: elementos constitutivos e classificação', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DIN0315';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 16, 'Nascimento, reconhecimento e extinção de Estado', 'Reconhecimento de governo', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DIN0315';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 17, 'Sucessão de Estados em matéria de tratados, bens, arquivos e dívidas', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DIN0315';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 18, 'Direitos e deveres dos Estados', 'Princípio de não intervenção', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DIN0315';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 19, 'Restrições aos direitos fundamentais dos Estados', 'Imunidade de jurisdição e de execução', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DIN0315';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 20, 'Responsabilidade internacional do Estado: princípios gerais e aplicação', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DIN0315';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 21, 'Órgãos das relações entre Estados', 'Chefe de Estado, MRE, missões diplomáticas', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DIN0315';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 22, 'Repartições consulares: nomeação, funções, privilégios e imunidades', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DIN0315';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 23, 'ONU: funcionamento, atribuições e ação coletiva', 'Assembleia Geral, Conselho de Segurança, CIJ', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DIN0315';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 24, 'Organizações internacionais especializadas: OMC e outras', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DIN0315';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 25, 'Organizações regionais', 'União Europeia, OEA, União Africana, Liga Árabe, APEC', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DIN0315';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 26, 'Direitos humanos', 'Declaração Universal, tratados ONU e sistemas regionais', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DIN0315';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 27, 'Direito da nacionalidade: aquisição, naturalização e perda', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DIN0315';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 28, 'Condição jurídica do estrangeiro', 'Extradição, deportação e expulsão. Proteção diplomática', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DIN0315';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 29, 'Território: domínio terrestre, fluvial e fronteiras', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DIN0315';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 30, 'Domínio marítimo', 'Águas internas, mar territorial, zona contígua, ZEE e plataforma continental', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DIN0315';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 31, 'Domínio aéreo e espaços internacionais', 'Alto-mar, espaço ultraterrestre, fundos oceânicos, polos', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DIN0315';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 32, 'Proteção internacional do meio ambiente', 'Estocolmo, Rio, Johannesburgo e princípios', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DIN0315';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 33, 'Solução pacífica de controvérsias: meios diplomáticos e jurídicos', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DIN0315';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 34, 'Tribunais internacionais', 'CIJ, Tribunal do Mar, Tribunal Penal Internacional', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DIN0315';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 35, 'Uso da força e guerra no direito internacional', 'Neutralidade e sanções', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DIN0315';

-- Tópicos de DPC0319 - Direito Processual Civil II (34 tópicos)
INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 1, 'Conceito e aspectos terminológicos da prova', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DPC0319';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 2, 'Direito à prova: inserção constitucional', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DPC0319';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 3, 'Prova, verdade e escopos do processo', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DPC0319';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 4, 'Prova pré-constituída e classificações', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DPC0319';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 5, 'Objeto, fonte e meio da prova', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DPC0319';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 6, 'Provas atípicas e provas ilícitas', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DPC0319';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 7, 'Destinatários da prova e poderes de instrução do juiz', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DPC0319';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 8, 'Ônus da prova e sua distribuição', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DPC0319';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 9, 'Presunções e regras de experiências comum', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DPC0319';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 10, 'Momento de admissão e sistemas de valoração', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DPC0319';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 11, 'Audiência de instrução e julgamento', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DPC0319';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 12, 'Sentença: conceito e requisitos', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DPC0319';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 13, 'Capítulos da sentença', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DPC0319';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 14, 'Regra de adstrição aos termos da demanda', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DPC0319';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 15, 'Decisões interlocutórias com conteúdo de sentença', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DPC0319';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 16, 'Motivação da sentença', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DPC0319';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 17, 'Coisa julgada: conceito e fundamentos político e jurídicos', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DPC0319';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 18, 'Limites objetivos e subjetivos da coisa julgada', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DPC0319';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 19, 'Flexibilização da coisa julgada', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DPC0319';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 20, 'Outros fenômenos de estabilização', 'Preclusão, ação monitória, estabilização da tutela antecipada', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DPC0319';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 21, 'Representação processual', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DPC0319';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 22, 'Deveres das partes e seus procuradores', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DPC0319';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 23, 'Sanções pelo descumprimento dos deveres processuais', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DPC0319';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 24, 'Custo do processo e honorários advocatícios', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DPC0319';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 25, 'Substituição e sucessão processual', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DPC0319';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 26, 'Litisconsórcio: conceito e classificações', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DPC0319';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 27, 'Intervenção de terceiros: conceito e classificações', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DPC0319';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 28, 'Chamamento ao processo', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DPC0319';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 29, 'Denunciação da lide', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DPC0319';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 30, 'Assistência', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DPC0319';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 31, 'Amicus curiae', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DPC0319';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 32, 'Intervenção litisconsorcial voluntária', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DPC0319';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 33, 'Oposição', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DPC0319';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 34, 'Outras modalidades de intervenção de terceiros', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DPC0319';

-- Tópicos de DTB0327 - Direito do Trabalho I (40 tópicos)
INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 1, 'História universal do Direito do Trabalho', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DTB0327';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 2, 'História do Direito do Trabalho no Brasil', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DTB0327';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 3, 'Conceito, definição e divisão do Direito do Trabalho', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DTB0327';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 4, 'Natureza jurídica do Direito do Trabalho', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DTB0327';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 5, 'Princípios do Direito do Trabalho', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DTB0327';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 6, 'Fontes formais e materiais do Direito do Trabalho', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DTB0327';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 7, 'A Constituição Federal e o Direito do Trabalho', 'A CLT', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DTB0327';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 8, 'Interpretação e Integração do Direito do Trabalho', 'Aplicação', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DTB0327';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 9, 'Direito Internacional do Trabalho', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DTB0327';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 10, 'Direito individual do trabalho', 'A relevância social, econômica e cultural da relação de emprego', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DTB0327';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 11, 'Natureza jurídica da relação de emprego', 'Anticontratualismo, teoria da relação de emprego, teoria institucionalista, contratualismo', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DTB0327';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 12, 'Configuração da relação de emprego', 'Validade e nulidade', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DTB0327';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 13, 'Capacidade', 'Objeto ilícito, impossível ou indeterminável. Forma. Simulação. Anulabilidade', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DTB0327';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 14, 'O empregador', 'A empresa como empregador. Poder diretivo', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DTB0327';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 15, 'Grupo econômico', 'Produção em rede. Sucessão de empresas', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DTB0327';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 16, 'Terceirização', 'Solidariedade. Responsabilidade social', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DTB0327';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 17, 'O empregado', 'Trabalho intelectual. Altos empregados', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DTB0327';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 18, 'A indeterminação como regra', 'A pré-determinação', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DTB0327';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 19, 'Serviço cuja natureza ou transitoriedade justifique a predeterminação do prazo', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DTB0327';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 20, 'Atividades empresariais de caráter transitório', 'Contrato de experiência. Contrato de safra', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DTB0327';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 21, 'Peculiaridades do contrato a tempo determinado', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DTB0327';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 22, 'Trabalho temporário', 'Contrato provisório. Contrato a tempo parcial', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DTB0327';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 23, 'Aprendizagem', 'Estágio', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DTB0327';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 24, 'Trabalho doméstico', 'Trabalho rural', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DTB0327';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 25, 'Adolescente', 'Trabalho da mulher. Pessoas com Necessidades Especiais', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DTB0327';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 26, 'Suspensão da Relação de Emprego', 'Suspensão temporária dos efeitos obrigacionais', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DTB0327';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 27, 'Alteração da Relação de Emprego', 'Alteração do Conteúdo Obrigacional', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DTB0327';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 28, 'Salário e remuneração: conceito e componentes', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DTB0327';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 29, 'Modalidades da estipulação do salário', '13º salário', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DTB0327';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 30, 'Gratificações', 'Adicionais, utilidades. Gorjetas. Prêmios. Comissões. Parcelas não salariais', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DTB0327';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 31, 'Salário mínimo', 'Piso salarial. Regras de proteção ao salário', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DTB0327';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 32, 'Equiparação salarial', 'Reajustes e aumento salariais', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DTB0327';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 33, 'Saúde e segurança do trabalho', 'Insalubridade. Periculosidade. Reflexos remuneratórios', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DTB0327';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 34, 'Jornadas de trabalho', 'Repouso semanal remunerado. Trabalhos em dias de repouso', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DTB0327';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 35, 'Controle de frequência', 'Justificação de ausências. Regime de compensação. Banco de horas. Horas extraordinárias', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DTB0327';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 36, 'Férias anuais remuneradas', 'Aquisição, concessão, férias coletivas, remuneração', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DTB0327';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 37, 'Fundo de Garantia por Tempo de Serviço', NULL, 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DTB0327';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 38, 'Cessação da Relação de Emprego', 'Eficácia do art. 7º, I, CF/88. Convenção 158 da OIT', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DTB0327';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 39, 'Estabilidade no emprego', 'Verbas rescisórias', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DTB0327';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 40, 'Justa causa do empregado e do empregador', 'Factum principis. Falência. Força maior. Aposentadoria. Prescrição', 'pendente'
FROM faculdade_disciplinas WHERE codigo = 'DTB0327';