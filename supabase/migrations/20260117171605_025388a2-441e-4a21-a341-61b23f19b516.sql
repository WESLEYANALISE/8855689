-- =====================================================
-- MIGRAÇÃO: Inserir Disciplinas e Tópicos do 8º Semestre
-- Grade Curricular USP - Curso de Direito 2014
-- =====================================================

-- Inserir as 3 disciplinas do 8º semestre
INSERT INTO faculdade_disciplinas (codigo, nome, nome_ingles, departamento, semestre, carga_horaria, ementa, objetivos, conteudo_programatico, url_jupiter, ativo)
VALUES 
-- Disciplina 1: TCC I (prática - sem tópicos teóricos)
(
  '0200115',
  'Trabalho de Conclusão de Curso I',
  'Final Paper I',
  'Faculdade de Direito',
  8,
  60,
  'Trabalhos individuais entregues obrigatoriamente, com atribuição de nota pelo orientador. Disciplina prática de orientação para elaboração do trabalho de conclusão de curso.',
  'Iniciar a elaboração do trabalho de conclusão de curso sob orientação docente, desenvolvendo habilidades de pesquisa jurídica, metodologia científica e redação acadêmica.',
  'Orientação individual para desenvolvimento do projeto de pesquisa e redação do trabalho de conclusão de curso.',
  'https://uspdigital.usp.br/jupiterweb/obterDisciplina?sgldis=0200115',
  true
),
-- Disciplina 2: Direito Tributário II
(
  'DEF0434',
  'Direito Tributário II',
  'Tax Law II',
  'Direito Econômico, Financeiro e Tributário',
  8,
  30,
  'Estudo aprofundado da obrigação tributária, do crédito tributário e dos procedimentos administrativos tributários, incluindo lançamento, suspensão, extinção e exclusão do crédito, bem como infrações e garantias.',
  'Proporcionar ao aluno conhecimento aprofundado sobre a dinâmica da obrigação tributária e do crédito tributário, capacitando-o para atuar profissionalmente em questões tributárias complexas.',
  'Obrigação tributária. Hipótese de incidência e fato gerador. Aspecto quantitativo e Sujeição ativa e passiva. Crédito Tributário e lançamento. Suspensão da Exigibilidade do Crédito Tributário. Extinção da Obrigação Tributária. Exclusão do Crédito Tributário. Infrações em Matéria Tributária. Garantias e privilégios do Crédito Tributário e Administração Tributária.',
  'https://uspdigital.usp.br/jupiterweb/obterDisciplina?sgldis=DEF0434',
  true
),
-- Disciplina 3: Seguridade Social
(
  'DTB0436',
  'Seguridade Social',
  'Social Security Law',
  'Direito do Trabalho e da Seguridade Social',
  8,
  30,
  'Estudo do Direito da Seguridade Social brasileiro, abrangendo seus fundamentos históricos, princípios, custeio e as prestações previdenciárias.',
  'Proporcionar conhecimento abrangente sobre o sistema de Seguridade Social brasileiro, capacitando o aluno a compreender e aplicar a legislação previdenciária.',
  'Evolução histórica da Seguridade Social. Denominação, Conceito e Divisão. Autonomia e posição enciclopédica. Fontes e aplicação das normas. Princípios da Seguridade Social. Custeio: fontes, contribuintes, arrecadação, responsabilidade solidária, crédito, decadência e prescrição. Previdência Social: conceito, princípios, beneficiários, prestações, acidente do trabalho, seguro-desemprego, cumulação de benefícios, tempo de serviço.',
  'https://uspdigital.usp.br/jupiterweb/obterDisciplina?sgldis=DTB0436',
  true
);

-- Inserir os tópicos do Direito Tributário II (DEF0434)
INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT 
  d.id,
  t.ordem,
  t.titulo,
  t.complemento,
  'pendente'
FROM faculdade_disciplinas d
CROSS JOIN (VALUES
  (1, 'Obrigação tributária', 'Obrigação Principal, Obrigação Acessória, Estrutura da relação tributária principal'),
  (2, 'Hipótese de incidência e fato gerador', 'Fato como base para tributação, "Situação Jurídica", Tributação dos fatos, Aspecto Material, Aspecto Temporal (instantâneos e periódicos, lei aplicável, influência no cálculo, antecipação), Aspecto Espacial'),
  (3, 'Aspecto quantitativo e Sujeição ativa e passiva', 'Natureza da obrigação principal, Base de cálculo (tributos vinculados e não vinculados), Alíquota, Aspecto Pessoal, Sujeito Ativo, Sujeito Passivo (Teoria Dualista: contribuinte x sujeito passivo), Responsável tributário (conceito e espécies)'),
  (4, 'Crédito Tributário e lançamento', 'Natureza do Lançamento, Crédito Tributário x Obrigação Tributária, Lançamento (conceito, modalidades e regimes)'),
  (5, 'Suspensão da Exigibilidade do Crédito Tributário', 'Conceito e espécies, Moratória, Depósito do Montante Integral, Reclamações e recursos administrativos, Medidas liminares, tutela antecipada e outras espécies de ação judicial, Parcelamento'),
  (6, 'Extinção da Obrigação Tributária', 'Extinção da obrigação e do crédito, Pagamento, Consignação em pagamento, Repetição do Indébito Tributário, Compensação, Transação, Remissão, Prescrição, Decadência, Outras hipóteses'),
  (7, 'Exclusão do Crédito Tributário', 'Exclusão no Código Tributário Nacional, Isenção, Anistia'),
  (8, 'Infrações em Matéria Tributária', 'Direito Tributário Penal e Direito Penal Tributário, Disciplina no Código Tributário Nacional, Responsabilidade por culpa, Responsabilidade pessoal do agente, Denúncia Espontânea, Crimes contra a ordem tributária'),
  (9, 'Garantias e privilégios do Crédito Tributário e Administração Tributária', 'Garantias, privilégios e preferências no Código Tributário Nacional, Fiscalização (amplitude do poder e formalização), Sigilo')
) AS t(ordem, titulo, complemento)
WHERE d.codigo = 'DEF0434';

-- Inserir os tópicos de Seguridade Social (DTB0436)
INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT 
  d.id,
  t.ordem,
  t.titulo,
  t.complemento,
  'pendente'
FROM faculdade_disciplinas d
CROSS JOIN (VALUES
  (1, 'Evolução histórica da Seguridade Social', 'Origem e desenvolvimento dos sistemas de proteção social no mundo e no Brasil, desde as primeiras formas de assistência até a consolidação do modelo de Seguridade Social na Constituição de 1988'),
  (2, 'Denominação, Conceito e Divisão da Seguridade Social', 'Terminologia adotada no direito brasileiro e comparado, conceito constitucional de Seguridade Social e sua divisão em Saúde, Previdência e Assistência Social'),
  (3, 'Autonomia do Direito da Seguridade Social', 'Fundamentos para a autonomia científica, didática e legislativa do Direito da Seguridade Social como ramo jurídico próprio'),
  (4, 'Posição enciclopédica do Direito da Seguridade Social', 'Localização do Direito da Seguridade Social no quadro geral das ciências jurídicas e sua classificação como direito público ou social'),
  (5, 'Relações do Direito da Seguridade Social com os demais ramos do Direito', 'Interfaces com o Direito Constitucional, Administrativo, Tributário, do Trabalho, Civil, Penal e Processual'),
  (6, 'Fontes do Direito da Seguridade Social', 'Constituição Federal, leis complementares e ordinárias, decretos, instruções normativas, jurisprudência, doutrina e princípios gerais'),
  (7, 'Aplicação das normas do Direito da Seguridade Social', 'Interpretação, integração, vigência no tempo e no espaço das normas de Seguridade Social'),
  (8, 'Princípios da Seguridade Social', 'Universalidade, uniformidade e equivalência, seletividade e distributividade, irredutibilidade do valor dos benefícios, equidade no custeio, diversidade da base de financiamento, caráter democrático e descentralizado da administração'),
  (9, 'Fontes de custeio da Seguridade Social', 'Orçamento da Seguridade Social, contribuições sociais, outras fontes de receita e o princípio da precedência da fonte de custeio'),
  (10, 'Contribuintes e segurados', 'Classificação dos contribuintes (empregadores, trabalhadores, segurados facultativos), conceito de segurado obrigatório e facultativo'),
  (11, 'Contribuições', 'Salário-de-contribuição, Salário-base, Outras contribuições, PIS, Cofins, Contribuição sobre o lucro'),
  (12, 'Arrecadação e recolhimento das contribuições', 'Procedimentos de arrecadação, prazos de recolhimento, obrigações acessórias, documentos de arrecadação'),
  (13, 'Responsabilidade solidária no custeio', 'Hipóteses de responsabilidade solidária, sub-rogação, retenção na fonte, responsabilidade de terceiros'),
  (14, 'Crédito da Seguridade Social', 'Decadência e prescrição do crédito previdenciário, constituição do crédito, execução fiscal'),
  (15, 'Previdência Social', 'Conceito, Princípios, Distinção entre previdência social, privada e complementar'),
  (16, 'Beneficiários da Previdência Social', 'Prestações e Benefícios: aposentadorias, pensões, auxílios, salário-família, salário-maternidade, benefícios acidentários'),
  (17, 'Acidente do trabalho', 'Seguro-desemprego: conceito de acidente do trabalho, doenças ocupacionais, CAT, benefícios acidentários, estabilidade provisória'),
  (18, 'Cumulação de benefícios e prescrição', 'Regras de cumulação de benefícios previdenciários, prescrição e decadência do direito aos benefícios'),
  (19, 'Tempo de serviço e contagem recíproca', 'Comprovação do tempo de contribuição, contagem recíproca entre regimes, certidão de tempo de contribuição')
) AS t(ordem, titulo, complemento)
WHERE d.codigo = 'DTB0436';