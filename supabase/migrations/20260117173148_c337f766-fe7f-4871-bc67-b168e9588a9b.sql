-- =============================================
-- MIGRAÇÃO: Adicionar disciplinas optativas eletivas ao 9º e 10º Semestres
-- Curso: Direito USP (2014)
-- =============================================

-- =============================================
-- DISCIPLINAS DO 9º SEMESTRE (OPTATIVAS ELETIVAS)
-- =============================================

-- 1. Direito da Empresa em Crise
INSERT INTO faculdade_disciplinas (codigo, nome, nome_ingles, departamento, semestre, carga_horaria, ementa, objetivos, conteudo_programatico, url_jupiter, ativo)
VALUES (
  'DCO0505',
  'Direito da Empresa em Crise',
  'Law of Distressed Business',
  'Departamento de Direito Comercial',
  9,
  60,
  'Estudo do regime jurídico da empresa em crise, incluindo recuperação judicial, extrajudicial e falência.',
  'Proporcionar conhecimento aprofundado sobre o direito concursal brasileiro, capacitando o aluno a compreender os mecanismos de recuperação e liquidação de empresas em crise.',
  'Evolução do direito concursal. Recuperação judicial e extrajudicial. Procedimento falimentar. Classificação de créditos. Liquidações extrajudiciais.',
  'https://uspdigital.usp.br/jupiterweb/obterDisciplina?sgldis=DCO0505&codcur=2014&codhab=104',
  true
);

-- 2. Direito Internacional dos Direitos Humanos
INSERT INTO faculdade_disciplinas (codigo, nome, nome_ingles, departamento, semestre, carga_horaria, ementa, objetivos, conteudo_programatico, url_jupiter, ativo)
VALUES (
  'DIN0527',
  'Direito Internacional dos Direitos Humanos',
  'International Human Rights Law',
  'Departamento de Direito Internacional e Comparado',
  9,
  30,
  'Estudo dos sistemas internacionais de proteção dos direitos humanos e sua aplicação no ordenamento brasileiro.',
  'Capacitar o aluno a compreender os fundamentos, evolução e mecanismos de proteção internacional dos direitos humanos.',
  'Teoria geral dos direitos humanos. Sistemas global, interamericano, europeu e africano. Direito internacional penal. Relação com o direito nacional.',
  'https://uspdigital.usp.br/jupiterweb/obterDisciplina?sgldis=DIN0527&codcur=2014&codhab=104',
  true
);

-- 3. Tributos Federais
INSERT INTO faculdade_disciplinas (codigo, nome, nome_ingles, departamento, semestre, carga_horaria, ementa, objetivos, conteudo_programatico, url_jupiter, ativo)
VALUES (
  'DEF0533',
  'Tributos Federais',
  'Federal Taxes',
  'Departamento de Direito Econômico, Financeiro e Tributário',
  9,
  30,
  'Análise detalhada dos tributos de competência federal no sistema tributário brasileiro.',
  'Proporcionar conhecimento aprofundado sobre a estrutura e funcionamento dos principais tributos federais.',
  'Sistema tributário nacional. Impostos aduaneiros. IOF. IPI. ITR. Imposto de Renda. Contribuições sociais. CIDE.',
  'https://uspdigital.usp.br/jupiterweb/obterDisciplina?sgldis=DEF0533&codcur=2014&codhab=104',
  true
);

-- 4. Direito Coletivo do Trabalho I: Liberdade Sindical
INSERT INTO faculdade_disciplinas (codigo, nome, nome_ingles, departamento, semestre, carga_horaria, ementa, objetivos, conteudo_programatico, url_jupiter, ativo)
VALUES (
  'DTB0533',
  'Direito Coletivo do Trabalho I: Liberdade Sindical',
  'Collective Labor Law I: Freedom of Association',
  'Departamento de Direito do Trabalho e da Seguridade Social',
  9,
  60,
  'Estudo da liberdade sindical como direito fundamental e suas dimensões no ordenamento brasileiro.',
  'Analisar a evolução histórica do sindicalismo e os fundamentos da liberdade sindical como direito social fundamental.',
  'Panorama histórico do sindicalismo. Experiências corporativistas. Liberdade sindical e suas dimensões. Garantias sindicais. Modelo sindical brasileiro.',
  'https://uspdigital.usp.br/jupiterweb/obterDisciplina?sgldis=DTB0533&codcur=2014&codhab=104',
  true
);

-- 5. Procedimentos Especiais no Âmbito Civil e Empresarial I
INSERT INTO faculdade_disciplinas (codigo, nome, nome_ingles, departamento, semestre, carga_horaria, ementa, objetivos, conteudo_programatico, url_jupiter, ativo)
VALUES (
  'DPC0519',
  'Procedimentos Especiais no Âmbito Civil e Empresarial I',
  'Special Procedures in Civil and Business Law I',
  'Departamento de Direito Processual',
  9,
  60,
  'Estudo dos procedimentos especiais de jurisdição contenciosa e voluntária no âmbito civil e empresarial.',
  'Capacitar o aluno a compreender e aplicar os procedimentos especiais previstos no Código de Processo Civil.',
  'Teoria geral dos procedimentos especiais. Ações possessórias. Inventário e partilha. Jurisdição voluntária. Procedimentos específicos.',
  'https://uspdigital.usp.br/jupiterweb/obterDisciplina?sgldis=DPC0519&codcur=2014&codhab=104',
  true
);

-- =============================================
-- DISCIPLINAS DO 10º SEMESTRE (OPTATIVAS ELETIVAS)
-- =============================================

-- 6. Direito da Criança e do Adolescente
INSERT INTO faculdade_disciplinas (codigo, nome, nome_ingles, departamento, semestre, carga_horaria, ementa, objetivos, conteudo_programatico, url_jupiter, ativo)
VALUES (
  '0200112',
  'Direito da Criança e do Adolescente',
  'Child and Adolescent Law',
  'Faculdade de Direito',
  10,
  30,
  'Estudo interdisciplinar do Direito da Criança e do Adolescente sob perspectivas civil, penal, processual e internacional.',
  'Proporcionar visão abrangente do sistema de proteção integral da criança e do adolescente.',
  'Histórico e princípios. Direitos fundamentais. Medidas de proteção. Atos infracionais. Proteção internacional. Procedimentos civis.',
  'https://uspdigital.usp.br/jupiterweb/obterDisciplina?sgldis=0200112&codcur=2014&codhab=104',
  true
);

-- 7. Fundamentos Jurídicos do Mercado de Capitais
INSERT INTO faculdade_disciplinas (codigo, nome, nome_ingles, departamento, semestre, carga_horaria, ementa, objetivos, conteudo_programatico, url_jupiter, ativo)
VALUES (
  'DCO0506',
  'Fundamentos Jurídicos do Mercado de Capitais',
  'Legal Foundations of Capital Markets',
  'Departamento de Direito Comercial',
  10,
  60,
  'Estudo da estrutura e regulação do mercado de capitais brasileiro.',
  'Capacitar o aluno a compreender o funcionamento e a regulação do mercado de capitais.',
  'Financiamento corporativo. Estrutura regulatória. Valores mobiliários. Ilícitos de mercado. Operações societárias.',
  'https://uspdigital.usp.br/jupiterweb/obterDisciplina?sgldis=DCO0506&codcur=2014&codhab=104',
  true
);

-- 8. Direito Penal Econômico
INSERT INTO faculdade_disciplinas (codigo, nome, nome_ingles, departamento, semestre, carga_horaria, ementa, objetivos, conteudo_programatico, url_jupiter, ativo)
VALUES (
  'DPM0526',
  'Direito Penal Econômico',
  'Economic Criminal Law',
  'Departamento de Direito Penal, Medicina Forense e Criminologia',
  10,
  30,
  'Estudo dos crimes econômicos e sua relação com o direito administrativo sancionador.',
  'Proporcionar conhecimento sobre a legislação penal econômica e seus principais tipos penais.',
  'Panorama do direito penal econômico. Crimes contra o sistema financeiro. Crimes tributários. Lavagem de dinheiro. Crimes falimentares.',
  'https://uspdigital.usp.br/jupiterweb/obterDisciplina?sgldis=DPM0526&codcur=2014&codhab=104',
  true
);

-- 9. Ética Profissional
INSERT INTO faculdade_disciplinas (codigo, nome, nome_ingles, departamento, semestre, carga_horaria, ementa, objetivos, conteudo_programatico, url_jupiter, ativo)
VALUES (
  'DFD0418',
  'Ética Profissional',
  'Professional Ethics',
  'Departamento de Filosofia e Teoria Geral do Direito',
  10,
  60,
  'Estudo das principais teorias éticas e sua aplicação às profissões jurídicas.',
  'Capacitar o aluno a refletir criticamente sobre questões éticas nas carreiras jurídicas.',
  'Conceito e tipologias de ética. Principais concepções éticas. Ética e direito. Códigos de ética das carreiras jurídicas.',
  'https://uspdigital.usp.br/jupiterweb/obterDisciplina?sgldis=DFD0418&codcur=2014&codhab=104',
  true
);

-- =============================================
-- TÓPICOS DO 9º SEMESTRE
-- =============================================

-- Tópicos de DCO0505 - Direito da Empresa em Crise (24 tópicos)
INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 1, 'A evolução do direito concursal no Brasil e os principais sistemas legislativos em vigor', 'Análise histórica das transformações do direito falimentar brasileiro, desde o Código Comercial de 1850 até a Lei 11.101/2005, comparando com os sistemas legislativos de outros países.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCO0505';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 2, 'Disposições preliminares e disposições gerais', 'Estudo das normas introdutórias da Lei 11.101/2005, incluindo conceitos fundamentais, âmbito de aplicação e exclusões legais.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCO0505';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 3, 'Disposições comuns à recuperação judicial e à falência', 'Verificação e habilitação de crédito no processo concursal, procedimentos e prazos.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCO0505';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 4, 'O administrador judicial e o comitê de credores', 'Funções, atribuições e responsabilidades do administrador judicial e do comitê de credores no processo concursal.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCO0505';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 5, 'A assembleia geral de credores', 'Composição, convocação, quórum deliberativo e competências da assembleia geral de credores na recuperação judicial e na falência.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCO0505';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 6, 'A recuperação judicial', 'Noções gerais sobre o instituto da recuperação judicial, seus objetivos, princípios norteadores e requisitos legais.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCO0505';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 7, 'O pedido e o processamento da recuperação judicial', 'Requisitos formais e materiais do pedido, documentação necessária e fases do processamento da recuperação judicial.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCO0505';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 8, 'O plano de recuperação judicial', 'Elaboração, conteúdo obrigatório, meios de recuperação e aprovação do plano pelos credores.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCO0505';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 9, 'O procedimento de recuperação judicial', 'Fases processuais, desde o deferimento do processamento até a decisão de encerramento ou convolação em falência.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCO0505';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 10, 'O procedimento simplificado para a pequena empresa', 'Regime especial de recuperação judicial para microempresas e empresas de pequeno porte.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCO0505';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 11, 'A recuperação extrajudicial', 'Requisitos, procedimento e homologação da recuperação extrajudicial como alternativa à recuperação judicial.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCO0505';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 12, 'A falência na atual lei', 'Noções gerais sobre o instituto da falência, seus objetivos e características fundamentais na Lei 11.101/2005.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCO0505';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 13, 'O procedimento para a decretação da falência', 'Legitimidade ativa, hipóteses de decretação e tramitação do pedido de falência.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCO0505';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 14, 'A autofalência', 'Requisitos e procedimento para o pedido de falência pelo próprio devedor empresário.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCO0505';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 15, 'A classificação dos créditos na falência', 'O pedido de restituição e a ordem de pagamento dos credores conforme a classificação legal.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCO0505';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 16, 'A inabilitação empresarial, os deveres e direitos do falido', 'Efeitos da decretação da falência sobre a pessoa do falido e suas atividades.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCO0505';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 17, 'A arrecadação e guarda dos bens', 'Procedimento de arrecadação, inventário e custódia do patrimônio do falido.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCO0505';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 18, 'Os efeitos da decretação de falência sobre as obrigações do devedor', 'Vencimento antecipado, suspensão de ações e execuções, e tratamento dos contratos do falido.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCO0505';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 19, 'A ineficácia e a revogação dos atos praticados antes da falência', 'Ação revocatória e declaração de ineficácia de atos prejudiciais à massa falida.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCO0505';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 20, 'A realização do ativo', 'Formas de alienação dos bens da massa falida e destinação dos recursos obtidos.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCO0505';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 21, 'O pagamento dos credores', 'Rateio, ordem de pagamento e procedimentos para satisfação dos créditos habilitados.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCO0505';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 22, 'O encerramento da falência', 'A extinção das obrigações, prestação de contas e sentença de encerramento. Disposições finais e transitórias da Lei 11.101/2005.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCO0505';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 23, 'As liquidações extrajudiciais', 'Regime especial aplicável a instituições financeiras, seguradoras e outras entidades sujeitas a intervenção e liquidação pelo Banco Central.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCO0505';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 24, 'A proposta de reforma da Lei', 'Os principais pontos de discussão para modernização do direito concursal brasileiro e tendências legislativas.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCO0505';

-- Tópicos de DIN0527 - Direito Internacional dos Direitos Humanos (17 tópicos)
INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 1, 'Teoria Geral dos Direitos Humanos', 'Introdução ao Direito Internacional dos Direitos Humanos. Evolução dos Direitos Humanos: Fundamentos, Princípios e Conceitos. Hermenêutica e interpretação.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DIN0527';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 2, 'As três vertentes do Direito Internacional dos Direitos Humanos', 'Direito Internacional dos Direitos Humanos stricto sensu, Direito Internacional Humanitário, Direito Internacional dos Refugiados.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DIN0527';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 3, 'O Desenvolvimento Histórico do Direito Internacional dos Direitos Humanos', 'Os precedentes históricos, as Revoluções Liberais, os Movimentos Socialistas e suas contribuições para a formação do sistema de proteção.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DIN0527';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 4, 'A 2ª Guerra e a ruptura dos Direitos Humanos', 'O Pós-Guerra: a reconstrução dos Direitos Humanos e a criação das bases do sistema internacional de proteção.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DIN0527';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 5, 'A Carta das Nações Unidas de 1945', 'O fim da competência exclusiva do Estado no campo dos direitos humanos. Afirmação dos direitos humanos na ordem internacional.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DIN0527';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 6, 'Introdução aos Sistemas de Proteção de Direitos Humanos', 'Características, regime jurídico, fundamento normativo: responsabilidade internacional do Estado por violações de direitos humanos.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DIN0527';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 7, 'O Sistema Global de Proteção de Direitos Humanos', 'Carta Internacional de Direitos Humanos. Declaração Universal, Pacto dos Direitos Civis e Políticos, Pacto dos Direitos Econômicos e Sociais.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DIN0527';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 8, 'Mecanismos Globais Convencionais de Proteção', 'Instrumentos de Proteção Geral e Particularizada (Genocídio, Tortura, Discriminação Racial, Discriminação à Mulher, Direitos da Criança).', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DIN0527';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 9, 'Mecanismos Globais Não-Convencionais de Proteção', 'As Nações Unidas e o Direito de Assistência Humanitária. Intervenções humanitárias e Missões de Paz.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DIN0527';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 10, 'O Sistema Interamericano de Proteção dos Direitos Humanos', 'Origens e Desenvolvimento Histórico. A Comissão Interamericana de Direitos Humanos.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DIN0527';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 11, 'A Corte Interamericana de Direitos Humanos', 'Jurisdição contenciosa e consultiva. Pareceres Consultivos e sua importância para a interpretação da Convenção Americana.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DIN0527';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 12, 'O cumprimento das decisões da Comissão e das sentenças da Corte no Brasil', 'Regras de execução e mecanismos de implementação das decisões internacionais no ordenamento jurídico brasileiro.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DIN0527';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 13, 'Sistema Europeu de Direitos Humanos', 'A Convenção Europeia, a Corte Europeia, Teoria da Margem de apreciação nacional e sua influência global.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DIN0527';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 14, 'Sistema Africano de Proteção', 'A Carta Africana, a Comissão Africana, a Corte Africana e as particularidades do sistema regional.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DIN0527';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 15, 'O Direito Internacional Penal', 'A face punitiva dos Direitos Humanos. Responsabilidade penal individual. Os Tribunais Penais Internacionais (Nuremberg, Tokyo, Iugoslávia, Ruanda, TPI).', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DIN0527';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 16, 'A Relação entre o Direito Nacional e o Direito Internacional dos Direitos Humanos', 'Pluralidade das Ordens Jurídicas. Controle de Convencionalidade e diálogo entre cortes.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DIN0527';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 17, 'A Constituição e o Direito Internacional dos Direitos Humanos', 'Hierarquia dos Tratados, Jurisprudência das Cortes Superiores, Federalização das violações de direitos humanos.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DIN0527';

-- Tópicos de DEF0533 - Tributos Federais (15 tópicos)
INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 1, 'O Sistema Tributário Nacional', 'Panorama dos tributos federais, sua inserção no sistema constitucional tributário e princípios aplicáveis.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DEF0533';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 2, 'Impostos aduaneiros na Constituição', 'Imposto de Exportação e Imposto de Importação. Disciplina constitucional e no CTN. Hipótese Tributária: critérios material, espacial, temporal, pessoal e quantitativo.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DEF0533';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 3, 'Imposto sobre operações de crédito, câmbio e seguro (IOF)', 'Disciplina constitucional e no CTN. Hipótese Tributária: critérios material, espacial, temporal, pessoal e quantitativo.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DEF0533';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 4, 'Imposto sobre Produtos Industrializados (IPI)', 'Disciplina constitucional e no CTN. Hipótese Tributária: critérios material, espacial, temporal, pessoal e quantitativo.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DEF0533';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 5, 'IPI: Seletividade e Não-Cumulatividade', 'Impacto reduzido sobre bens de capital. Análise dos princípios constitucionais aplicáveis ao IPI.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DEF0533';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 6, 'Imposto Territorial Rural (ITR)', 'Disciplina constitucional e no CTN. Progressividade. Não incidência sobre glebas rurais. Parafiscalidade e delegação aos municípios.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DEF0533';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 7, 'Imposto sobre a Renda (IR)', 'Disciplina constitucional e no CTN. Disponibilidade Econômica e Jurídica como critérios de incidência.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DEF0533';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 8, 'IR: O princípio da realização da renda', 'A tributação de rendimentos auferidos no Exterior. Progressividade e seus fundamentos constitucionais.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DEF0533';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 9, 'IR: A tributação das pessoas físicas e jurídicas', 'Bitributação econômica. Lucro real, presumido e arbitrado. Regimes de tributação.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DEF0533';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 10, 'Imposto sobre Grandes Fortunas (IGF)', 'Disciplina Constitucional. Potenciais delimitações. Competência da lei complementar e discussões sobre sua implementação.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DEF0533';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 11, 'Contribuições Sociais: PIS e COFINS', 'Regimes cumulativo e não-cumulativo. Base de cálculo e principais questões jurisprudenciais.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DEF0533';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 12, 'Contribuição Social sobre o Lucro Líquido (CSLL)', 'Contribuição para iluminação pública (COSIP). Natureza jurídica e regime constitucional.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DEF0533';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 13, 'Contribuições de Intervenção no Domínio Econômico (CIDE)', 'CIDE-combustíveis e CIDE-tecnologia. Finalidade, base de cálculo e destinação dos recursos.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DEF0533';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 14, 'Contribuições de interesse das categorias profissionais ou econômicas', 'Contribuições corporativas e seu regime jurídico específico.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DEF0533';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 15, 'Perspectivas da tributação federal no Brasil', 'Reforma tributária, tendências legislativas e desafios do sistema tributário federal.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DEF0533';

-- Tópicos de DTB0533 - Direito Coletivo do Trabalho I (12 tópicos)
INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 1, 'Panorama histórico universal do sindicalismo', 'Evolução do movimento sindical desde as corporações de ofício medievais até o sindicalismo contemporâneo.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DTB0533';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 2, 'Panorama histórico brasileiro do sindicalismo', 'Das primeiras associações operárias à estrutura sindical atual, passando pelas transformações constitucionais.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DTB0533';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 3, 'Doutrina e experiências corporativistas: Itália e Alemanha', 'O corporativismo fascista italiano e o modelo nacional-socialista alemão como antecedentes do modelo brasileiro.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DTB0533';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 4, 'Doutrina e experiências corporativistas: Brasil e Espanha', 'A influência do corporativismo na formação da estrutura sindical brasileira e espanhola.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DTB0533';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 5, 'Liberdade sindical e autonomia privada coletiva', 'Fundamentos teóricos da liberdade sindical e sua relação com a autonomia negocial coletiva.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DTB0533';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 6, 'Liberdade sindical como direito social fundamental', 'Tratados internacionais, convenções da OIT e a proteção constitucional da liberdade sindical.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DTB0533';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 7, 'Dimensões da liberdade sindical: Liberdade de organização', 'Direito de criar, estruturar e dissolver organizações sindicais sem interferência estatal.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DTB0533';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 8, 'Dimensões da liberdade sindical: Liberdade de administração', 'Autonomia na gestão interna, elaboração de estatutos e definição de políticas sindicais.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DTB0533';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 9, 'Dimensões da liberdade sindical: Liberdade de filiação', 'Direito de se filiar, permanecer filiado ou se desfiliar de entidades sindicais.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DTB0533';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 10, 'Dimensões da liberdade sindical: Liberdade de exercício de funções', 'Direito de exercer atividades sindicais, incluindo negociação coletiva e greve.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DTB0533';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 11, 'Garantias da liberdade sindical: Proteção contra atos antissindicais', 'Mecanismos de proteção do dirigente sindical e combate a práticas antissindicais do empregador.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DTB0533';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 12, 'O modelo sindical brasileiro e perspectivas de reforma', 'Unicidade sindical, contribuição sindical e propostas de modernização do sistema brasileiro.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DTB0533';

-- Tópicos de DPC0519 - Procedimentos Especiais no Âmbito Civil e Empresarial I (27 tópicos)
INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 1, 'Teoria geral dos procedimentos especiais', 'Fundamentos, classificação e características que distinguem os procedimentos especiais do procedimento comum.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DPC0519';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 2, 'Ação de consignação em pagamento', 'Requisitos, procedimento e hipóteses de cabimento da consignação judicial e extrajudicial.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DPC0519';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 3, 'Ações de exigir de contas', 'Legitimidade, procedimento bifásico e particularidades da prestação de contas.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DPC0519';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 4, 'Ações possessórias', 'Reintegração, manutenção de posse e interdito proibitório. Caráter dúplice e fungibilidade.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DPC0519';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 5, 'Ação de divisão e demarcação de terras particulares', 'Procedimento para divisão e demarcação de imóveis em condomínio ou com limites indefinidos.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DPC0519';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 6, 'Ação de dissolução parcial de sociedade', 'Hipóteses de cabimento, procedimento e apuração de haveres do sócio retirante.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DPC0519';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 7, 'Inventário: Aspectos gerais e procedimento', 'Abertura, prazo, inventariante, avaliação de bens e pagamento de dívidas do espólio.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DPC0519';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 8, 'Arrolamento: Modalidades e procedimento', 'Arrolamento comum e sumário. Requisitos e simplificação procedimental.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DPC0519';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 9, 'Partilha judicial e extrajudicial', 'Partilha amigável e litigiosa. Inventário extrajudicial em cartório.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DPC0519';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 10, 'Embargos de terceiro', 'Legitimidade, procedimento e defesa possessória de terceiro afetado por ato judicial.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DPC0519';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 11, 'Oposição', 'Intervenção de terceiro que pretende para si, total ou parcialmente, a coisa ou direito disputado.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DPC0519';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 12, 'Habilitação', 'Procedimento para sucessão processual em caso de morte ou outras hipóteses legais.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DPC0519';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 13, 'Ações de família', 'Procedimento especial para divórcio, separação, reconhecimento de união estável e guarda.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DPC0519';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 14, 'Ação monitória', 'Requisitos, procedimento e conversão em execução. Defesa do réu.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DPC0519';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 15, 'Homologação de penhor legal', 'Procedimento para regularização do penhor constituído pelo credor em situações de urgência.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DPC0519';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 16, 'Regulação de avaria grossa', 'Procedimento marítimo para rateio de danos e despesas extraordinárias em navegação.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DPC0519';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 17, 'Restauração de autos', 'Procedimento para reconstituição de autos perdidos ou destruídos.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DPC0519';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 18, 'Teoria geral da jurisdição voluntária', 'Natureza jurídica, características e princípios da jurisdição voluntária.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DPC0519';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 19, 'Procedimento comum de jurisdição voluntária', 'Regras gerais aplicáveis aos procedimentos de jurisdição voluntária.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DPC0519';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 20, 'Notificações, interpelações e protestos', 'Procedimentos para comunicação formal de vontade ou constituição em mora.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DPC0519';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 21, 'Alienação judicial', 'Procedimento para venda de bens por determinação judicial fora do contexto executivo.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DPC0519';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 22, 'Divórcio e Separação Consensuais, Extinção de União Estável, Alteração do Regime de Bens', 'Procedimentos de jurisdição voluntária para questões familiares consensuais.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DPC0519';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 23, 'Testamentos: Procedimentos', 'Abertura, registro, cumprimento e confirmação de testamentos.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DPC0519';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 24, 'Herança jacente e Bens dos ausentes', 'Procedimentos para administração de heranças sem herdeiros conhecidos e bens de pessoas ausentes.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DPC0519';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 25, 'Coisas vagas', 'Procedimento para coisas achadas e sua destinação legal.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DPC0519';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 26, 'Interdição, tutela e curatela', 'Procedimentos para proteção de incapazes e nomeação de representantes legais.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DPC0519';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 27, 'Organização das fundações e Ratificação dos Protestos Marítimos', 'Procedimentos especiais de jurisdição voluntária para fundações e direito marítimo.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DPC0519';

-- =============================================
-- TÓPICOS DO 10º SEMESTRE
-- =============================================

-- Tópicos de 0200112 - Direito da Criança e do Adolescente (22 tópicos)
INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 1, 'Histórico do Direito da Criança e do Adolescente', 'Legislação aplicável: evolução desde o Código de Menores até o Estatuto da Criança e do Adolescente.', 'pendente' FROM faculdade_disciplinas WHERE codigo = '0200112';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 2, 'Princípios do Direito da Criança e do Adolescente', 'Proteção integral, prioridade absoluta, interesse superior da criança e corresponsabilidade.', 'pendente' FROM faculdade_disciplinas WHERE codigo = '0200112';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 3, 'Direitos Fundamentais: Direito à vida e à saúde', 'Proteção desde a concepção, atendimento médico, vacinação e políticas públicas de saúde.', 'pendente' FROM faculdade_disciplinas WHERE codigo = '0200112';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 4, 'Direitos Fundamentais: Direito à liberdade, ao respeito e à dignidade', 'Autonomia progressiva, direito de expressão, preservação da imagem e da identidade.', 'pendente' FROM faculdade_disciplinas WHERE codigo = '0200112';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 5, 'Direitos Fundamentais: Direito à convivência familiar e comunitária', 'Família natural, família substituta, guarda, tutela e adoção.', 'pendente' FROM faculdade_disciplinas WHERE codigo = '0200112';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 6, 'Direitos Fundamentais: Direito à educação, à cultura, ao esporte e ao lazer', 'Acesso à educação, permanência na escola, atividades culturais e recreativas.', 'pendente' FROM faculdade_disciplinas WHERE codigo = '0200112';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 7, 'Direitos Fundamentais: Direito à profissionalização e à proteção no trabalho', 'Trabalho do adolescente, aprendizagem, proibições e garantias trabalhistas.', 'pendente' FROM faculdade_disciplinas WHERE codigo = '0200112';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 8, 'Da prevenção geral e da prevenção especial', 'Medidas preventivas, autorização para viagem, classificação indicativa e fiscalização.', 'pendente' FROM faculdade_disciplinas WHERE codigo = '0200112';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 9, 'Políticas de Atendimento e Entidades de Atendimento', 'Sistema de garantia de direitos, rede de atendimento e responsabilidades das entidades.', 'pendente' FROM faculdade_disciplinas WHERE codigo = '0200112';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 10, 'Medidas de Proteção', 'Rol de medidas, aplicação, revisão e fiscalização das medidas protetivas.', 'pendente' FROM faculdade_disciplinas WHERE codigo = '0200112';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 11, 'Conselhos de Direitos da Criança e Conselho Tutelar', 'Composição, atribuições, funcionamento e importância no sistema de proteção.', 'pendente' FROM faculdade_disciplinas WHERE codigo = '0200112';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 12, 'Criminalidade Juvenil e pós-modernidade', 'A prevenção da criminalidade juvenil e fatores de risco na sociedade contemporânea.', 'pendente' FROM faculdade_disciplinas WHERE codigo = '0200112';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 13, 'Sistema de garantias', 'Os tratados internacionais e a Constituição Brasileira na proteção dos direitos da criança.', 'pendente' FROM faculdade_disciplinas WHERE codigo = '0200112';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 14, 'A legislação comparada e o conceito de jovem adulto', 'Sistemas de responsabilização juvenil em outros países e discussões sobre maioridade penal.', 'pendente' FROM faculdade_disciplinas WHERE codigo = '0200112';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 15, 'Análise dogmática do ECA: Atos infracionais e medidas socioeducativas', 'Conceito de ato infracional, procedimento de apuração e rol de medidas socioeducativas.', 'pendente' FROM faculdade_disciplinas WHERE codigo = '0200112';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 16, 'Inclinação dos Tribunais na adoção do Direito Penal Juvenil', 'Jurisprudência e tendências interpretativas sobre responsabilização de adolescentes.', 'pendente' FROM faculdade_disciplinas WHERE codigo = '0200112';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 17, 'Histórico da proteção internacional da criança', 'Instrumentos normativos internacionais: Convenção sobre os Direitos da Criança e protocolos facultativos.', 'pendente' FROM faculdade_disciplinas WHERE codigo = '0200112';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 18, 'O Comitê da ONU para os Direitos da Criança', 'Adoção Internacional: requisitos, procedimento e Convenção de Haia.', 'pendente' FROM faculdade_disciplinas WHERE codigo = '0200112';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 19, 'Sequestro internacional de crianças', 'Convenção de Haia sobre sequestro e procedimento de restituição.', 'pendente' FROM faculdade_disciplinas WHERE codigo = '0200112';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 20, 'Direitos Fundamentais na Perspectiva do Direito Processual Civil', 'Garantias processuais aplicáveis aos procedimentos envolvendo crianças e adolescentes.', 'pendente' FROM faculdade_disciplinas WHERE codigo = '0200112';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 21, 'Procedimentos Civis do ECA: Aspectos gerais', 'Competência, legitimidade, participação do Ministério Público e princípios processuais específicos.', 'pendente' FROM faculdade_disciplinas WHERE codigo = '0200112';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 22, 'Procedimentos Civis do ECA: Ações específicas', 'Ação de destituição do poder familiar, colocação em família substituta e outras ações previstas no ECA.', 'pendente' FROM faculdade_disciplinas WHERE codigo = '0200112';

-- Tópicos de DCO0506 - Fundamentos Jurídicos do Mercado de Capitais (13 tópicos)
INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 1, 'Financiamento corporativo', 'Estrutura de capital. Mercado Financeiro e de Capitais: distinções e complementaridades.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCO0506';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 2, 'Estrutura e função do mercado de capitais', 'Mercado Primário e secundário. IPO e follow on. Bolsa, balcão e negociações privadas. Dark pools.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCO0506';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 3, 'Mercado de Capitais e o regime da informação', 'Disclosure, fato relevante, insider information e dever de sigilo.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCO0506';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 4, 'Mercado de Capitais: Estrutura regulatória (I)', 'CMN, BACEN, CVM, Instituições Financeiras e suas competências.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCO0506';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 5, 'Mercado de Capitais: Estrutura regulatória (II)', 'Entidades Autorreguladoras: B3, ANBIMA e outras entidades de mercado.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCO0506';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 6, 'Valores mobiliários: Conceito', 'Definição legal, rol exemplificativo e critérios de caracterização.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCO0506';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 7, 'Valores mobiliários: Derivativos e contratos de investimento coletivo', 'Opções, futuros, swaps e outros instrumentos derivativos. CICs e fundos.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCO0506';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 8, 'Securitização e Fundos de Investimento', 'Estruturas de securitização, FIDCs, FIIs e outros fundos estruturados.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCO0506';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 9, 'Ilícitos de mercado: Insider trading e práticas não equitativas', 'Uso de informação privilegiada, manipulação de mercado e outras condutas ilícitas.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCO0506';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 10, 'Processo Administrativo Sancionador', 'CVM, Bacen, COAF, CRSFN: competências e procedimentos sancionatórios.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCO0506';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 11, 'Abertura e fechamento de capital', 'Requisitos, procedimento de registro, manutenção e cancelamento.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCO0506';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 12, 'Operações com controle', 'Poder de controle no mercado. Prêmio, Alienação e Ofertas públicas de aquisição.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCO0506';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 13, 'Globalização e mercados de capital', 'Integração dos mercados, regulação transfronteiriça e desafios contemporâneos.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DCO0506';

-- Tópicos de DPM0526 - Direito Penal Econômico (10 tópicos)
INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 1, 'Introdução à Legislação Penal Econômica', 'Conceito, evolução e características do direito penal econômico.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DPM0526';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 2, 'Panorama atual do Direito Penal Econômico', 'Expansão do direito penal, criminalização de condutas econômicas e tendências legislativas.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DPM0526';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 3, 'Direito Penal Econômico e Direito Administrativo Sancionador', 'Distinções, sobreposições e princípio do non bis in idem.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DPM0526';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 4, 'Crimes Econômicos em espécie: Introdução', 'Classificação, bem jurídico tutelado e técnicas legislativas.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DPM0526';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 5, 'Crimes contra o Sistema Financeiro Nacional', 'Lei 7.492/86: principais tipos penais, sujeitos ativos e questões processuais.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DPM0526';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 6, 'Crimes contra a Ordem Tributária', 'Lei 8.137/90: sonegação fiscal, fraude e apropriação indébita tributária.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DPM0526';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 7, 'Crimes Previdenciários', 'Apropriação indébita previdenciária e sonegação de contribuição previdenciária.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DPM0526';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 8, 'Lavagem de Dinheiro', 'Lei 9.613/98: fases, tipificação, prevenção e cooperação internacional.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DPM0526';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 9, 'Crimes contra as relações de consumo', 'Crimes do CDC e outras infrações penais nas relações de consumo.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DPM0526';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 10, 'Crimes falimentares', 'Tipos penais da Lei 11.101/2005 e sua relação com o processo falimentar.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DPM0526';

-- Tópicos de DFD0418 - Ética Profissional (8 tópicos)
INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 1, 'O conceito de ética', 'Tipologias: Ética, Ética Prática e Metaética. Distinção entre ética, moral e direito.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DFD0418';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 2, 'As principais concepções da ética na história do pensamento Ocidental', 'Ética aristotélica, estoica, cristã medieval, moderna e contemporânea.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DFD0418';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 3, 'Consequencialismo', 'Utilitarismo clássico e contemporâneo. Análise de consequências e maximização do bem-estar.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DFD0418';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 4, 'Éticas do Dever', 'Deontologia kantiana, imperativos categóricos e o dever como fundamento da ação moral.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DFD0418';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 5, 'Ética das Virtudes', 'Retorno à ética aristotélica, virtudes cardinais e sua aplicação contemporânea.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DFD0418';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 6, 'Ética e Direito', 'Relações entre moral e direito, positivismo jurídico e jusnaturalismo.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DFD0418';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 7, 'Ética e Profissões Jurídicas', 'Códigos de ética das carreiras jurídicas: advocacia, magistratura, Ministério Público e outras.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DFD0418';

INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT id, 8, 'Ética e Mudança social', 'O papel das profissões jurídicas na transformação social e responsabilidade profissional.', 'pendente' FROM faculdade_disciplinas WHERE codigo = 'DFD0418';