-- Inserir as 5 disciplinas do 7º semestre da grade USP 2014
INSERT INTO faculdade_disciplinas (codigo, nome, nome_ingles, departamento, semestre, carga_horaria, ementa, objetivos, conteudo_programatico, url_jupiter, ativo)
VALUES
  ('DCO0413', 'Direito Societário I', 'General Theory of Partnerships and Corporate Law I', 'Direito Comercial', 7, 60, 
   'Estudo da teoria geral do direito societário, com enfoque nas sociedades limitadas e sociedades por ações, abrangendo constituição, capital social, direitos dos sócios, administração e operações societárias.',
   'Proporcionar conhecimento aprofundado sobre o regime jurídico das sociedades empresárias, especialmente as limitadas e as anônimas.',
   'Sociedade limitada; Sociedades por ações; Constituição; Capital social e ações; Debêntures; Direitos e deveres de acionistas; Assembleias; Administração; Conselho Fiscal; Demonstrações financeiras; Dissolução; Transformação e reorganização societária; Grupos societários.',
   'https://uspdigital.usp.br/jupiterweb/obterDisciplina?sgldis=DCO0413', true),
  
  ('DCV0415', 'Direito de Família e Sucessões', 'Family and Inheritance Law', 'Direito Civil', 7, 60,
   'Estudo do direito de família e das sucessões, abrangendo casamento, união estável, parentesco, alimentos, e a transmissão causa mortis dos bens.',
   'Proporcionar visão completa do direito de família constitucionalizado e do direito sucessório brasileiro.',
   'Família constitucionalizada; Casamento; Regimes de bens; Divórcio; União estável; Parentesco; Alimentos; Sucessão legítima; Vocação hereditária; Herança.',
   'https://uspdigital.usp.br/jupiterweb/obterDisciplina?sgldis=DCV0415', true),
  
  ('DEF0429', 'Direito Tributário I', 'Tax Law I', 'Direito Econômico, Financeiro e Tributário', 7, 60,
   'Introdução ao direito tributário brasileiro, abrangendo conceito de tributo, espécies tributárias, competência, imunidades, fontes e princípios limitadores do poder de tributar.',
   'Apresentar os fundamentos do Sistema Tributário Nacional e os princípios constitucionais tributários.',
   'Conceito de tributo; Espécies tributárias; Competência tributária; Imunidades; Fontes do direito tributário; Princípios tributários; Interpretação da lei tributária; Vigência e aplicação.',
   'https://uspdigital.usp.br/jupiterweb/obterDisciplina?sgldis=DEF0429', true),
  
  ('DIN0441', 'Direito do Comércio Internacional', 'International Trade Law', 'Direito Internacional e Comparado', 7, 30,
   'Estudo do direito do comércio internacional, abrangendo jurisdição, arbitragem, lei aplicável, direito comparado, uniformização e contratos internacionais.',
   'Capacitar o aluno a compreender e atuar em operações de comércio internacional.',
   'Jurisdição e arbitragem internacional; Lei aplicável; Direito comparado; Direito uniforme e transnacional; Contratos internacionais; CISG; INCOTERMS.',
   'https://uspdigital.usp.br/jupiterweb/obterDisciplina?sgldis=DIN0441', true),
  
  ('DPC0429', 'Direito Processual Penal II', 'Criminal Procedure II', 'Direito Processual', 7, 30,
   'Continuação do estudo do processo penal, abrangendo sentença, coisa julgada, nulidades, recursos e ações autônomas de impugnação.',
   'Aprofundar o conhecimento sobre a fase decisória e recursal do processo penal.',
   'Sentença; Coisa julgada; Nulidades; Recursos; Revisão Criminal; Habeas Corpus; Mandado de segurança.',
   'https://uspdigital.usp.br/jupiterweb/obterDisciplina?sgldis=DPC0429', true);

-- Inserir os tópicos da disciplina DCO0413 - Direito Societário I (16 tópicos)
INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 1, 'A sociedade limitada e seu regime', '', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCO0413'
UNION ALL SELECT id, 2, 'As sociedades por ações', 'Origem e evolução histórica', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCO0413'
UNION ALL SELECT id, 3, 'Companhias abertas e fechadas', '', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCO0413'
UNION ALL SELECT id, 4, 'Constituição das sociedades', '', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCO0413'
UNION ALL SELECT id, 5, 'Capital social e sua divisão em ações', 'Espécies e classes de ações. A forma de circulação das ações', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCO0413'
UNION ALL SELECT id, 6, 'Debêntures e partes beneficiárias', '', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCO0413'
UNION ALL SELECT id, 7, 'Direitos e deveres de acionistas', 'O acionista controlador', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCO0413'
UNION ALL SELECT id, 8, 'Assembleias gerais e especiais', '', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCO0413'
UNION ALL SELECT id, 9, 'Administração', '', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCO0413'
UNION ALL SELECT id, 10, 'Conselho Fiscal', '', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCO0413'
UNION ALL SELECT id, 11, 'Aumento e redução do capital social', 'Bônus de subscrição e opções de compra de ações', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCO0413'
UNION ALL SELECT id, 12, 'Demonstrações financeiras', 'Lucros e distribuição', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCO0413'
UNION ALL SELECT id, 13, 'Dissolução, liquidação e extinção', '', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCO0413'
UNION ALL SELECT id, 14, 'Transformação, incorporação, fusão e cisão das sociedades', '', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCO0413'
UNION ALL SELECT id, 15, 'Negócios sobre o controle acionário', '', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCO0413'
UNION ALL SELECT id, 16, 'Os grupos societários', '', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCO0413';

-- Inserir os tópicos da disciplina DCV0415 - Direito de Família e Sucessões (13 tópicos)
INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 1, 'Direito de família: considerações preambulares', 'A família constitucionalizada e os múltiplos arranjos familiais na contemporaneidade. O Poder Judiciário e os julgados inovadores. Visão geral', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCV0415'
UNION ALL SELECT id, 2, 'Casamento: conceito e fins', 'Princípios matrimoniais. Capacidade para o casamento. Habilitação para o casamento. Impedimentos matrimoniais, causas suspensivas e incapacidade matrimonial. Conceito, classificação, aspectos penais, oposição', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCV0415'
UNION ALL SELECT id, 3, 'Casamento: celebração, formalidades essenciais', 'Suspensão, registro, formas especiais de celebração, casamento por procuração, casamento nuncupativo, casamento religioso com efeitos civis. Casamento putativo. Invalidade (nulidade e anulabilidade), inexistência. Prazos decadenciais', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCV0415'
UNION ALL SELECT id, 4, 'Efeitos jurídicos pessoais do casamento', 'Direitos e deveres entre cônjuges. Direitos e deveres dos cônjuges em relação aos filhos. Efeitos jurídicos patrimoniais: pacto antenupcial, regime de bens. Comunhão universal, comunhão parcial, separação de bens convencional e obrigatória, participação final de aquestos', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCV0415'
UNION ALL SELECT id, 5, 'Dissolução da sociedade conjugal e do vínculo matrimonial', 'Divórcio: judicial e extrajudicial', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCV0415'
UNION ALL SELECT id, 6, 'União estável: efeitos jurídicos pessoais e patrimoniais', 'Contrato de convivência. Dissolução. União estável homoafetiva', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCV0415'
UNION ALL SELECT id, 7, 'Parentesco: conceito, espécies, linhas e contagem de graus', 'Reconhecimento voluntário e forçado. Ações relativas à paternidade e à maternidade', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCV0415'
UNION ALL SELECT id, 8, 'Alimentos: conceito, natureza jurídica', 'Alimentos e casamento, alimentos decorrentes do divórcio, alimentos decorrentes da dissolução da união estável, alimentos entre parentes. Revisão, exoneração, extinção', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCV0415'
UNION ALL SELECT id, 9, 'Direito das Sucessões', 'Momento da transmissão da herança. Instauração do inventário. Indivisibilidade da herança. Ordem da vocação hereditária. Aceitação e renúncia da herança. Cessão de direitos hereditários', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCV0415'
UNION ALL SELECT id, 10, 'Legitimação sucessória', 'Exclusão do herdeiro por indignidade. Distinção entre falta de legitimação para suceder, indignidade e deserdação', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCV0415'
UNION ALL SELECT id, 11, 'Sucessão legítima', 'Sucessão por direito próprio (por cabeça) e por representação (por estirpe) e partilha em linha. Sucessão na linha reta descendente e ascendente', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCV0415'
UNION ALL SELECT id, 12, 'Sucessão na linha colateral', 'Herança vacante e herança jacente', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCV0415'
UNION ALL SELECT id, 13, 'Sucessão do cônjuge e do companheiro', '', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCV0415';

-- Inserir os tópicos da disciplina DEF0429 - Direito Tributário I (10 tópicos)
INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 1, 'Conceito de Direito Tributário', 'Conteúdo, história e objetivos da tributação. Características do Sistema Tributário Nacional', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DEF0429'
UNION ALL SELECT id, 2, 'Conceito de Tributo', 'Tributo como receita. Receitas originárias e receitas derivadas. Taxa vs. Preço Público. Importância constitucional do conceito de tributo. Conceito de tributo na Constituição Federal. Conceito de tributo no Código Tributário Nacional', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DEF0429'
UNION ALL SELECT id, 3, 'Espécies Tributárias', 'Classificações tradicionais: correntes dicotômica e tricotômica. Limitações da classificação a partir da hipótese tributária. Destinação e denominação. Classificação a partir dos regimes constitucionais. Taxas, contribuição de melhoria, impostos, empréstimo compulsório, contribuições sociais e contribuições especiais', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DEF0429'
UNION ALL SELECT id, 4, 'Competência Tributária', 'Sistematização das categorias técnicas da tributação. Competência tributária x capacidade tributária ativa. Competência tributária e competência legislativa. Repartição de competências tributárias segundo as espécies tributárias. Competência residual. Papel da Lei Complementar. Conceitos vs. tipos. Conflitos de Competência', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DEF0429'
UNION ALL SELECT id, 5, 'Imunidades Tributárias', 'Construção da norma de imunidade. Classificação: imunidade recíproca, imunidade dos templos de qualquer culto, imunidade dos partidos políticos, das entidades sindicais de trabalhadores e das entidades de assistência social e de educação. Imunidade dos livros e periódicos, imunidade dos fonogramas e videofonogramas musicais. Imunidades e taxas. Imunidades e tributos indiretos', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DEF0429'
UNION ALL SELECT id, 6, 'Fontes do Direito Tributário', 'A Constituição Federal. Lei Complementar: concepção e funções. Código Tributário Nacional: surgimento e estrutura. Lei Ordinária, Medida Provisória, Lei delegada, Resolução, Decreto Legislativo. Tratados internacionais. Convênios. Decretos. Normas Complementares', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DEF0429'
UNION ALL SELECT id, 7, 'Normas limitadoras do Poder de Tributar', 'Como os tributos podem ser cobrados: legalidade e devido processo legal. Quando os tributos podem ser cobrados: anterioridade e irretroatividade. Em que medida os tributos podem ser cobrados: igualdade, capacidade contributiva, proibição de confisco, proporcionalidade e razoabilidade', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DEF0429'
UNION ALL SELECT id, 8, 'Princípios Específicos em Matéria Tributária', 'Progressividade. Regressividade. Não-Cumulatividade', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DEF0429'
UNION ALL SELECT id, 9, 'Interpretação e Integração da Lei Tributária', 'Teorias da Interpretação. Interpretação, integração e aplicação. Direito Tributário e Direito Privado. Consideração Econômica. Analogia. Interpretação literal das isenções', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DEF0429'
UNION ALL SELECT id, 10, 'Vigência e Aplicação da Lei Tributária', 'Vigência no tempo. Vigência no espaço. Aplicação e retroatividade', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DEF0429';

-- Inserir os tópicos da disciplina DIN0441 - Direito do Comércio Internacional (7 tópicos)
INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 1, 'O Direito do Comércio Internacional como disciplina', 'Objeto. Metodologia. Denominação', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DIN0441'
UNION ALL SELECT id, 2, 'Jurisdição e arbitragem internacional', 'Critérios de determinação da jurisdição competente. Pacto de jurisdição. A arbitragem internacional como mecanismo de solução de disputas do comércio internacional. Reconhecimento e execução de sentenças estrangeiras. Convenção de Nova Iorque de 1958', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DIN0441'
UNION ALL SELECT id, 3, 'Lei aplicável', 'Critérios de determinação da lei aplicável. Cláusula de escolha da lei aplicável', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DIN0441'
UNION ALL SELECT id, 4, 'Direito comparado', 'Metodologia. Diferenças entre sistemas jurídicos. Análise comparatista de cláusulas contratuais', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DIN0441'
UNION ALL SELECT id, 5, 'Direito uniforme e transnacional', 'Unificação, uniformização e harmonização do direito do comércio internacional. Entidades que atuam na estruturação do comércio internacional: UNCITRAL, UNIDROIT, OAS, ICC, IBA, GAFTA, FOSFA, FIDIC. Principais instrumentos de uniformização e harmonização: convenções internacionais, leis modelo, princípios gerais de direito, outros instrumentos de soft law', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DIN0441'
UNION ALL SELECT id, 6, 'Contratos internacionais', 'Conceito. Contratos complexos e relacionais. Contrato de compra e venda internacional de mercadorias. Regras da CISG, Princípios do UNIDROIT (PICC), INCOTERMS. Questões relativas a seguro e transporte', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DIN0441'
UNION ALL SELECT id, 7, 'Cláusulas dos contratos internacionais', 'Cláusulas de hardship e força maior. Cláusulas de liquidated damages e de penalidade. Cláusulas de sole remedy, limitation of liability. Outras cláusulas típicas do comércio internacional', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DIN0441';

-- Inserir os tópicos da disciplina DPC0429 - Direito Processual Penal II (17 tópicos)
INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 1, 'Sentença e coisa julgada', 'Sentença condenatória e absolutória', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DPC0429'
UNION ALL SELECT id, 2, 'Correlação entre acusação e sentença', '', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DPC0429'
UNION ALL SELECT id, 3, 'Coisa julgada material e formal', '', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DPC0429'
UNION ALL SELECT id, 4, 'Limites objetivos e subjetivos da coisa julgada', '', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DPC0429'
UNION ALL SELECT id, 5, 'Nulidades', 'Teoria das nulidades', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DPC0429'
UNION ALL SELECT id, 6, 'Sistema de nulidades e Constituição', '', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DPC0429'
UNION ALL SELECT id, 7, 'Princípios, espécies e efeitos das nulidades', '', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DPC0429'
UNION ALL SELECT id, 8, 'Nulidades em espécie', '', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DPC0429'
UNION ALL SELECT id, 9, 'Teoria geral dos recursos', 'Conceito e classificações', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DPC0429'
UNION ALL SELECT id, 10, 'Juízo de admissibilidade e juízo de mérito dos recursos', '', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DPC0429'
UNION ALL SELECT id, 11, 'Pressupostos de admissibilidade recursal', '', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DPC0429'
UNION ALL SELECT id, 12, 'Recursos em espécie no processo penal', '', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DPC0429'
UNION ALL SELECT id, 13, 'Ações autônomas de impugnação', 'Revisão Criminal', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DPC0429'
UNION ALL SELECT id, 14, 'Habeas Corpus', 'Conceito, natureza jurídica e hipóteses de cabimento', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DPC0429'
UNION ALL SELECT id, 15, 'Habeas Corpus: Procedimento e julgamento', '', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DPC0429'
UNION ALL SELECT id, 16, 'Mandado de segurança no processo penal', '', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DPC0429'
UNION ALL SELECT id, 17, 'Outras ações autônomas de impugnação', '', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DPC0429';