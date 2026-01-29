-- Inserir as 7 disciplinas do 3º semestre da USP

INSERT INTO faculdade_disciplinas (codigo, nome, nome_ingles, departamento, semestre, carga_horaria, ementa, objetivos, conteudo_programatico, url_jupiter, ativo)
VALUES
-- 1. Fundamentos e Princípios do Direito Empresarial
('DCO0221', 'Fundamentos e Princípios do Direito Empresarial', 'Fundamentals and Principles of Business Law', 'Direito Comercial', 3, 60,
'Destacar a especialidade do Direito Comercial no campo do Direito Privado, evidenciando seus princípios e sua sistematização. Fornecer os fundamentos sobre as várias formas de organização empresarial.',
'Fornecer aos alunos os fundamentos do Direito Comercial, destacando sua especialidade no campo do Direito Privado, seus princípios e sistematização, bem como as várias formas de organização empresarial.',
'1. História do direito comercial. 2. Direito comercial e as demandas econômicas: racionalidade econômica e racionalidade jurídica. 3. A unificação parcial do direito privado e recodificação. 4. Fontes do direito comercial. 5. Princípios e vértices do sistema de direito comercial. 6. Ato e atividade. 7. Empresa e mercado. 8. O empresário e seus auxiliares. 9. Escrituração. 10. Registro Público das Empresas. 11. Trespasse. 12. O papel da atividade econômica na geração de riqueza e bem-estar. 13. A nova lex mercatoria. 14. Distinções fundamentais: sociedade e comunhão; sociedade e associação; sociedade e fundação; sociedade e empresa; sociedades simples e empresárias. 15. Natureza jurídica do contrato associativo. 16. Elementos essenciais do contrato. 17. Elementos essenciais da organização societária. 18. Personalidade jurídica das sociedades e associações. 19. A teoria da desconsideração da personalidade jurídica. 20. A sociedade simples. 21. As sociedades personificadas e as sociedades não personificadas. 22. A sociedade cooperativa. 23. Visão geral sobre a disciplina da crise empresarial.',
'https://uspdigital.usp.br/jupiterweb/obterDisciplina?sgldis=DCO0221', true),

-- 2. Teoria Geral das Obrigações
('DCV0215', 'Teoria Geral das Obrigações', 'General Theory of Obligations', 'Direito Civil', 3, 60,
'Apresentar a teoria geral das obrigações no direito civil brasileiro, abrangendo conceito, classificação, fontes, transmissão, adimplemento e inadimplemento das obrigações.',
'Proporcionar ao aluno o conhecimento da teoria geral das obrigações, suas fontes, classificações, formas de transmissão, extinção e consequências do inadimplemento.',
'1. Noção geral de obrigação. Conceito de obrigação. 2. Noção de relação jurídica obrigacional. Elementos constitutivos. 3. A obrigação no quadro das posições jurídicas. Distinção entre obrigação, dever em geral, ônus e situação de sujeição. 4. Distinção entre direitos reais e pessoais. Obrigação propter rem. 5. Evolução histórica. O vínculo jurídico: débito e responsabilidade. 6. Obrigação civil e obrigação natural. Casos de quebra da igualdade entre débito e responsabilidade. 7. Complexidade obrigacional. Deveres de prestar e outros deveres de conduta. Boa-fé e deveres laterais de conduta. 8. Fontes das obrigações: as várias classificações. 9. Visão atual quadripartida das fontes das obrigações. 10. Fontes voluntárias negociais. Negócio jurídico: contratos e atos unilaterais obrigacionais. 11. Fontes voluntárias não negociais. As relações contratuais de fato. 12. Fontes involuntárias consistentes em ato ilícito. Pressupostos da responsabilidade civil. 13. Outras fontes involuntárias. A responsabilidade objetiva. Legítima defesa e estado de necessidade. 14. Classificação das obrigações. 15. Obrigações de dar. 16. Obrigações de fazer e não fazer. 17. Obrigações de prestar declaração de vontade. 18. Obrigações pecuniárias. O princípio do nominalismo. Cláusula de escala móvel. 19. Obrigações de meios, resultado e garantia. 20. Obrigações divisíveis e indivisíveis. 21. Obrigações solidárias. Conceito, solidariedade ativa, solidariedade passiva. 22. Obrigações alternativas. 23. Obrigações principais e acessórias. 24. Pessoas vinculadas à obrigação. Situação dos herdeiros. 25. Distinção entre pagamento, adimplemento e cumprimento da obrigação. 26. Natureza jurídica do pagamento. 27. De quem deve ou pode pagar. 28. Daqueles a quem se deve ou se pode pagar. 29. Objeto do pagamento. 30. Prova do pagamento. Presunções de pagamento. Quitação. 31. Lugar e tempo do pagamento. Antecipações de vencimento. 32. Pagamento em consignação. 33. Dação em pagamento. 34. Imputação em pagamento. 35. Compensação. 36. Novação. 37. Confusão. 38. Remissão de dívidas. 39. Cessão de crédito. 40. Assunção de dívida. 41. Cessão de posição contratual. 42. Noção geral de inadimplemento. Distinção entre mora e inadimplemento absoluto. 43. A boa-fé e o descumprimento de obrigações secundárias ou de deveres acessórios. 44. Mora: conceito e espécies. 45. Mora do devedor. Consequências e purgação. 46. Termo inicial da mora. Constituição em mora. 47. Mora do credor. Consequências e purgação. 48. Inadimplemento absoluto. 49. Adimplemento imperfeito. Violação positiva do contrato. 50. Figuras relativas ao inadimplemento subordinadas à boa-fé: adimplemento substancial, tender of performance. 51. Outras figuras relativas ao inadimplemento: inadimplemento antecipado e inadimplemento eficiente. 52. Perdas e danos. Juros legais. 53. Cláusula penal. Natureza e caracteres. 54. Pena convencional moratória e compensatória. 55. Redução e efeitos da cláusula penal. 56. Extinção das obrigações sem pagamento.',
'https://uspdigital.usp.br/jupiterweb/obterDisciplina?sgldis=DCV0215', true),

-- 3. Direito Financeiro
('DEF0215', 'Direito Financeiro', 'Financial Law', 'Direito Econômico, Financeiro e Tributário', 3, 60,
'Estudo do sistema de Direito Financeiro, abrangendo receitas públicas, federalismo fiscal, orçamento público, despesas públicas, fundos, crédito público e fiscalização financeira.',
'Proporcionar ao aluno conhecimento sobre a atividade financeira do Estado, receitas e despesas públicas, orçamento, crédito público e mecanismos de controle.',
'1. Sistema de Direito Financeiro: definição, autonomia e metodologia. 2. O conceito constitucional de atividade financeira do Estado. 3. A noção de Fazenda Pública. 4. Direito Financeiro na Constituição: competências e princípios. 5. Fontes do Direito Financeiro: Constituição e leis complementares. 6. A Lei 4320 de 1964. 7. A Lei de Responsabilidade Fiscal. 8. Receitas Públicas: conceito e classificações. 9. Receitas tributárias: impostos, taxas e contribuições. 10. O conceito de sistema tributário. 11. Receitas não tributárias e patrimoniais. 12. Royalties e compensações financeiras. 13. Fiscalidade e parafiscalidade. 14. Limites para renúncias de receitas ou gastos fiscais. 15. Federalismo fiscal: evolução no Brasil. 16. Discriminação constitucional de rendas. 17. Competências tributárias. 18. Repartição do produto da arrecadação: transferências intergovernamentais. 19. Autonomia financeira das unidades do federalismo. 20. Orçamento público: origem, evolução e conceito. 21. Regime constitucional do orçamento público. 22. Princípios orçamentários. 23. O planejamento público nas leis orçamentárias. 24. O Plano Plurianual (PPA). 25. A Lei de Diretrizes Orçamentárias (LDO). 26. A Lei de Orçamento Anual (LOA). 27. Formação e procedimentos do orçamento. 28. Orçamento participativo. 29. O princípio de flexibilidade orçamentária. 30. Despesas públicas: conceito e classificações. 31. O ordenador de despesas e procedimentos. 32. Despesas com pessoal e seus limites. 33. Precatórios. 34. Eficiência e qualidade do gasto público. 35. Fundos Públicos Financeiros e tipos de fundos. 36. Fundo de Participação dos Estados e Municípios. 37. Crédito Público e Dívida pública. 38. Operações de crédito: natureza jurídica. 39. Dívida interna, externa e federalismo. 40. Controles da dívida pública na LRF. 41. Fiscalização financeira e orçamentária. 42. Controle interno e externo. 43. Tribunais de Contas. 44. Responsabilidade de agentes públicos.',
'https://uspdigital.usp.br/jupiterweb/obterDisciplina?sgldis=DEF0215', true),

-- 4. Direito Constitucional I: Direitos Fundamentais
('DES0223', 'Direito Constitucional I: Direitos Fundamentais', 'Constitutional Law I: Fundamental Rights', 'Direito do Estado', 3, 60,
'Estudo do constitucionalismo, poder constituinte, princípios constitucionais, eficácia das normas, direitos fundamentais e suas garantias.',
'Proporcionar ao aluno o estudo aprofundado dos direitos fundamentais, sua evolução histórica, classificação, interpretação e mecanismos de proteção.',
'1. Constitucionalismo e conceito de constituição. 2. Poder constituinte. 3. Princípios constitucionais. 4. A eficácia das normas constitucionais. 5. Interpretação e aplicação das normas constitucionais. 6. Os direitos fundamentais e suas gerações. 7. Direitos individuais. 8. Direitos sociais e políticas públicas. 9. Nacionalidade e direitos políticos. 10. Colisões entre direitos fundamentais: razoabilidade e proporcionalidade. 11. Garantia dos direitos fundamentais: remédios constitucionais. 12. Estado de defesa e estado de sítio.',
'https://uspdigital.usp.br/jupiterweb/obterDisciplina?sgldis=DES0223', true),

-- 5. Sociologia Jurídica
('DFD0215', 'Sociologia Jurídica', 'Sociology of Law', 'Filosofia e Teoria Geral do Direito', 3, 60,
'Estudo das abordagens clássicas e contemporâneas da sociologia do direito, relações entre direito e sociedade, mudança social, globalização e o papel do direito no Brasil.',
'Proporcionar ao aluno uma visão sociológica do fenômeno jurídico, analisando as relações entre direito, sociedade, economia e política.',
'1. A abordagem clássica: Durkheim e o direito. 2. A abordagem clássica: Marx e o direito. 3. A abordagem clássica: Weber e o direito. 4. Paradigmas científicos e senso comum: desafios epistemológicos. 5. Direito e modernização reflexiva. 6. Direito responsivo e direito reflexivo. 7. Direito entre modernidade e pós-modernidade. 8. Direito e estrutura social no pensamento contemporâneo. 9. Direito e ordem jurídica liberal. 10. Direito, democracia e Estado de bem-estar social. 11. Direito, economia e justiça social. 12. Legalidade, eficácia, efetividade e legitimidade da ordem jurídica. 13. Direito, risco e responsabilidade. 14. Direito e desenvolvimento em sociedades complexas. 15. Mudança social e processo legal: a complexificação dos conflitos. 16. Direito, exclusão e vulnerabilidade social. 17. Os direitos humanos e o sistema de justiça como problema social. 18. Direito, protesto e movimentos sociais. 19. O Judiciário e os direitos sociais. 20. Pluralismo jurídico e novos tipos de conflito. 21. A crise do Estado: globalização e padronização das políticas econômicas. 22. A globalização e os espaços jurídicos transnacionais. 23. Direito e política: a juridicização do político. 24. Novos usos do direito para a regulação política. 25. O direito e a crise econômica de 2008. 26. Comunidade virtual, sociedade em rede e comunicação eletrônica. 27. O público e o privado na sociedade brasileira. 28. Regulação e burocratização na industrialização brasileira. 29. Direito, tecnocracia e modernização autoritária pós-64. 30. O direito e a transição democrática nos anos 80. 31. Era Vargas versus Era Pós-Vargas: reformas nos anos 90. 32. Direito, exclusão social e subcidadania no Brasil. 33. Direito e ideologia: ensino jurídico e função social dos juristas.',
'https://uspdigital.usp.br/jupiterweb/obterDisciplina?sgldis=DFD0215', true),

-- 6. Teoria Geral do Processo
('DPC0215', 'Teoria Geral do Processo', 'General Theory of Procedure', 'Direito Processual', 3, 30,
'Estudo da jurisdição, processo, procedimento, direito de ação e defesa, tutela jurisdicional e princípios constitucionais do processo.',
'Proporcionar ao aluno os fundamentos da teoria geral do processo, compreendendo jurisdição, ação, defesa e organização judiciária.',
'1. Jurisdição: evolução histórica. 2. Função jurisdicional e função administrativa. 3. Função jurisdicional e função legislativa. 4. Conceito atual e classificações de jurisdição. 5. Limites da jurisdição. 6. Jurisdição voluntária. 7. Direito material e direito processual: institutos bifrontes. 8. Teoria unitária e teoria dualista do direito. 9. Processo: evolução histórica e conceito atual. 10. Processo e procedimento. 11. Cognição: conceito e classificações. 12. Cognição e execução. 13. Fases metodológicas do estudo do direito processual. 14. Instrumentalidade do processo. 15. Autotutela, autocomposição e heterocomposição. 16. Mediação e conciliação: conceitos gerais. 17. Arbitragem: conceitos gerais. 18. Direito de ação e direito de defesa: teorias clássicas. 19. Conceito atual dos direitos de ação e de defesa. 20. Tutela jurisdicional: conceito e classificações. 21. Crises do direito material. 22. Tutela constitucional do processo: princípios constitucionais. 23. Tutela constitucional pelo processo: remédios constitucionais. 24. Sujeitos essenciais à distribuição da justiça. 25. Organização judiciária. 26. Fontes do direito processual. 27. Eficácia da lei processual no tempo e no espaço. 28. Interpretação da lei processual.',
'https://uspdigital.usp.br/jupiterweb/obterDisciplina?sgldis=DPC0215', true),

-- 7. Teoria Geral do Direito Penal I
('DPM0215', 'Teoria Geral do Direito Penal I', 'General Theory of Criminal Law I', 'Direito Penal, Medicina Forense e Criminologia', 3, 60,
'Estudo dos princípios fundamentais do Direito Penal, aplicação da lei penal, teoria geral do delito, tipicidade, antijuridicidade, culpabilidade e concurso de pessoas.',
'Proporcionar ao aluno os fundamentos da teoria geral do direito penal, abrangendo princípios, aplicação da lei penal e teoria do delito.',
'1. Direito Penal e Constituição. Princípios fundamentais do Direito Penal. 2. Aplicação da lei penal no tempo. 3. Aplicação da lei penal no espaço. 4. Interpretação da lei penal. 5. Prazos penais. 6. Conflito aparente de normas. 7. Teoria geral do delito. 8. Tipicidade: conceito de ação. 9. Crimes comissivos e omissivos. 10. Resultado e nexo de causalidade. 11. Elemento subjetivo do tipo. 12. Classificações dos tipos penais. 13. Iter criminis. 14. Consumação e tentativa. 15. Desistência voluntária e arrependimento eficaz. 16. Arrependimento posterior. 17. Crime impossível. 18. Antijuridicidade: conceito e causas de justificação. 19. Legítima defesa. 20. Estado de necessidade. 21. Exercício regular de direito. 22. Estrito cumprimento de dever legal. 23. Consentimento do ofendido. 24. Culpabilidade. 25. Imputabilidade penal. 26. Inexigibilidade de conduta diversa. 27. Coação irresistível. 28. Caso fortuito ou força maior. 29. Erro de tipo. 30. Erro de proibição. 31. Concurso de Pessoas.',
'https://uspdigital.usp.br/jupiterweb/obterDisciplina?sgldis=DPM0215', true);

-- Inserir os tópicos de cada disciplina
-- Os tópicos serão inseridos com base no disciplina_id obtido

-- Tópicos para DCO0221 - Fundamentos e Princípios do Direito Empresarial (23 tópicos)
INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT d.id, t.ordem, t.titulo, t.complemento, 'pendente'
FROM faculdade_disciplinas d
CROSS JOIN (VALUES
  (1, 'História do direito comercial', 'Evolução histórica do direito comercial desde a Idade Média até os dias atuais'),
  (2, 'Direito comercial e as demandas econômicas', 'Racionalidade econômica e racionalidade jurídica no contexto empresarial'),
  (3, 'A unificação parcial do direito privado e recodificação', 'Análise do processo de unificação do direito privado no Código Civil de 2002'),
  (4, 'Fontes do direito comercial', 'Lei, costumes, jurisprudência e princípios gerais como fontes do direito empresarial'),
  (5, 'Princípios e vértices do sistema de direito comercial', 'Princípios fundamentais que regem as relações comerciais'),
  (6, 'Ato e atividade', 'Distinção entre ato de comércio e atividade empresarial'),
  (7, 'Empresa e mercado', 'Conceito de empresa e sua inserção no mercado econômico'),
  (8, 'O empresário e seus auxiliares', 'Definição de empresário e papel dos prepostos e colaboradores'),
  (9, 'Escrituração', 'Obrigações contábeis e livros empresariais'),
  (10, 'Registro Público das Empresas', 'Sistema de registro empresarial e suas funções'),
  (11, 'Trespasse', 'Transferência do estabelecimento empresarial'),
  (12, 'O papel da atividade econômica na geração de riqueza e bem-estar', 'Função social da empresa e impacto econômico'),
  (13, 'A nova lex mercatoria', 'Direito comercial internacional e usos do comércio global'),
  (14, 'Distinções fundamentais', 'Sociedade e comunhão; sociedade e associação; sociedade e fundação; sociedade e empresa; sociedades simples e empresárias'),
  (15, 'Natureza jurídica do contrato associativo', 'Teoria contratualista e institucionalista das sociedades'),
  (16, 'Elementos essenciais do contrato', 'Requisitos de validade do contrato social'),
  (17, 'Elementos essenciais da organização societária', 'Affectio societatis, contribuição e participação nos resultados'),
  (18, 'Personalidade jurídica das sociedades e associações', 'Aquisição e efeitos da personalidade jurídica'),
  (19, 'A teoria da desconsideração da personalidade jurídica', 'Hipóteses de desconsideração e proteção dos credores'),
  (20, 'A sociedade simples', 'Características e regime jurídico da sociedade simples'),
  (21, 'As sociedades personificadas e as sociedades não personificadas', 'Distinção e regime aplicável a cada tipo'),
  (22, 'A sociedade cooperativa', 'Princípios cooperativistas e regime jurídico específico'),
  (23, 'Visão geral sobre a disciplina da crise empresarial', 'Recuperação judicial, extrajudicial e falência')
) AS t(ordem, titulo, complemento)
WHERE d.codigo = 'DCO0221';

-- Tópicos para DCV0215 - Teoria Geral das Obrigações (56 tópicos)
INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT d.id, t.ordem, t.titulo, t.complemento, 'pendente'
FROM faculdade_disciplinas d
CROSS JOIN (VALUES
  (1, 'Noção geral de obrigação', 'Conceito de obrigação no direito civil'),
  (2, 'Noção de relação jurídica obrigacional', 'Elementos constitutivos: sujeitos, objeto e vínculo'),
  (3, 'A obrigação no quadro das posições jurídicas', 'Distinção entre obrigação, dever em geral, ônus e situação de sujeição'),
  (4, 'Distinção entre direitos reais e pessoais', 'Obrigação propter rem e suas características'),
  (5, 'Evolução histórica', 'O vínculo jurídico: débito e responsabilidade'),
  (6, 'Obrigação civil e obrigação natural', 'Casos de quebra da igualdade entre débito e responsabilidade'),
  (7, 'Complexidade obrigacional', 'Deveres de prestar e outros deveres de conduta. Boa-fé e deveres laterais de conduta'),
  (8, 'Fontes das obrigações', 'As várias classificações doutrinárias'),
  (9, 'Visão atual quadripartida das fontes das obrigações', 'Contratos, atos unilaterais, atos ilícitos e lei'),
  (10, 'Fontes voluntárias negociais', 'Negócio jurídico: contratos e atos unilaterais obrigacionais'),
  (11, 'Fontes voluntárias não negociais', 'As relações contratuais de fato'),
  (12, 'Fontes involuntárias consistentes em ato ilícito', 'Pressupostos da responsabilidade civil'),
  (13, 'Outras fontes involuntárias', 'A responsabilidade objetiva. Legítima defesa e estado de necessidade'),
  (14, 'Classificação das obrigações', 'Critérios e tipos de obrigações'),
  (15, 'Obrigações de dar', 'Dar coisa certa e dar coisa incerta'),
  (16, 'Obrigações de fazer e não fazer', 'Execução específica e conversão em perdas e danos'),
  (17, 'Obrigações de prestar declaração de vontade', 'Sentença substitutiva da declaração'),
  (18, 'Obrigações pecuniárias', 'O princípio do nominalismo. Cláusula de escala móvel'),
  (19, 'Obrigações de meios, resultado e garantia', 'Distinção e consequências práticas'),
  (20, 'Obrigações divisíveis e indivisíveis', 'Regime jurídico e efeitos'),
  (21, 'Obrigações solidárias', 'Conceito, solidariedade ativa, solidariedade passiva'),
  (22, 'Obrigações alternativas', 'Escolha e concentração'),
  (23, 'Obrigações principais e acessórias', 'Relação de dependência'),
  (24, 'Pessoas vinculadas à obrigação', 'Situação dos herdeiros'),
  (25, 'Distinção entre pagamento, adimplemento e cumprimento', 'Terminologia e conceitos'),
  (26, 'Natureza jurídica do pagamento', 'Teorias sobre a natureza do pagamento'),
  (27, 'De quem deve ou pode pagar', 'Legitimados ao pagamento'),
  (28, 'Daqueles a quem se deve ou se pode pagar', 'Legitimados a receber'),
  (29, 'Objeto do pagamento', 'Princípios da identidade e integridade'),
  (30, 'Prova do pagamento', 'Presunções de pagamento. Quitação'),
  (31, 'Lugar e tempo do pagamento', 'Antecipações de vencimento'),
  (32, 'Pagamento em consignação', 'Hipóteses e procedimento'),
  (33, 'Dação em pagamento', 'Requisitos e efeitos'),
  (34, 'Imputação em pagamento', 'Regras de imputação'),
  (35, 'Compensação', 'Requisitos e espécies'),
  (36, 'Novação', 'Objetiva, subjetiva e mista'),
  (37, 'Confusão', 'Efeitos da reunião de credor e devedor'),
  (38, 'Remissão de dívidas', 'Formas de remissão'),
  (39, 'Cessão de crédito', 'Requisitos e efeitos'),
  (40, 'Assunção de dívida', 'Modalidades e requisitos'),
  (41, 'Cessão de posição contratual', 'Transmissão global da posição'),
  (42, 'Noção geral de inadimplemento', 'Distinção entre mora e inadimplemento absoluto'),
  (43, 'A boa-fé e o descumprimento de obrigações secundárias', 'Violação de deveres acessórios'),
  (44, 'Mora: conceito e espécies', 'Mora solvendi e mora accipiendi'),
  (45, 'Mora do devedor', 'Consequências e purgação'),
  (46, 'Termo inicial da mora', 'Constituição em mora'),
  (47, 'Mora do credor', 'Consequências e purgação'),
  (48, 'Inadimplemento absoluto', 'Impossibilidade e inutilidade da prestação'),
  (49, 'Adimplemento imperfeito', 'Violação positiva do contrato'),
  (50, 'Figuras relativas ao inadimplemento subordinadas à boa-fé', 'Adimplemento substancial, tender of performance'),
  (51, 'Outras figuras relativas ao inadimplemento', 'Inadimplemento antecipado e inadimplemento eficiente'),
  (52, 'Perdas e danos', 'Juros legais e indenização'),
  (53, 'Cláusula penal', 'Natureza e caracteres'),
  (54, 'Pena convencional moratória e compensatória', 'Distinção e aplicação'),
  (55, 'Redução e efeitos da cláusula penal', 'Controle judicial da cláusula penal'),
  (56, 'Extinção das obrigações sem pagamento', 'Outras formas de extinção')
) AS t(ordem, titulo, complemento)
WHERE d.codigo = 'DCV0215';

-- Tópicos para DEF0215 - Direito Financeiro (44 tópicos)
INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT d.id, t.ordem, t.titulo, t.complemento, 'pendente'
FROM faculdade_disciplinas d
CROSS JOIN (VALUES
  (1, 'Sistema de Direito Financeiro', 'Definição, autonomia e metodologia'),
  (2, 'O conceito constitucional de atividade financeira do Estado', 'Obtenção, gestão e dispêndio de recursos públicos'),
  (3, 'A noção de Fazenda Pública', 'Conceito e abrangência'),
  (4, 'Direito Financeiro na Constituição', 'Competências e princípios constitucionais'),
  (5, 'Fontes do Direito Financeiro', 'Constituição e leis complementares'),
  (6, 'A Lei 4320 de 1964', 'Normas gerais de direito financeiro'),
  (7, 'A Lei de Responsabilidade Fiscal', 'Princípios e regras da LRF'),
  (8, 'Receitas Públicas: conceito e classificações', 'Originárias e derivadas'),
  (9, 'Receitas tributárias', 'Impostos, taxas e contribuições'),
  (10, 'O conceito de sistema tributário', 'Estrutura constitucional tributária'),
  (11, 'Receitas não tributárias e patrimoniais', 'Outras fontes de receita'),
  (12, 'Royalties e compensações financeiras', 'Recursos naturais e compensação'),
  (13, 'Fiscalidade e parafiscalidade', 'Distinção e aplicação'),
  (14, 'Limites para renúncias de receitas ou gastos fiscais', 'Controle das renúncias fiscais'),
  (15, 'Federalismo fiscal: evolução no Brasil', 'História e desenvolvimento'),
  (16, 'Discriminação constitucional de rendas', 'Repartição de competências'),
  (17, 'Competências tributárias', 'União, Estados e Municípios'),
  (18, 'Repartição do produto da arrecadação', 'Transferências intergovernamentais'),
  (19, 'Autonomia financeira das unidades do federalismo', 'Independência financeira dos entes'),
  (20, 'Orçamento público: origem, evolução e conceito', 'História e conceito moderno'),
  (21, 'Regime constitucional do orçamento público', 'Normas constitucionais orçamentárias'),
  (22, 'Princípios orçamentários', 'Unidade, universalidade, anualidade'),
  (23, 'O planejamento público nas leis orçamentárias', 'Integração do planejamento'),
  (24, 'O Plano Plurianual (PPA)', 'Estrutura e conteúdo'),
  (25, 'A Lei de Diretrizes Orçamentárias (LDO)', 'Função e importância'),
  (26, 'A Lei de Orçamento Anual (LOA)', 'Elaboração e execução'),
  (27, 'Formação e procedimentos do orçamento', 'Processo legislativo orçamentário'),
  (28, 'Orçamento participativo', 'Participação popular no orçamento'),
  (29, 'O princípio de flexibilidade orçamentária', 'Créditos adicionais'),
  (30, 'Despesas públicas: conceito e classificações', 'Tipos de despesas públicas'),
  (31, 'O ordenador de despesas e procedimentos', 'Responsabilidade e controle'),
  (32, 'Despesas com pessoal e seus limites', 'Limites da LRF'),
  (33, 'Precatórios', 'Regime jurídico e pagamento'),
  (34, 'Eficiência e qualidade do gasto público', 'Avaliação de políticas públicas'),
  (35, 'Fundos Públicos Financeiros e tipos de fundos', 'Fundos especiais e vinculados'),
  (36, 'Fundo de Participação dos Estados e Municípios', 'FPE e FPM'),
  (37, 'Crédito Público e Dívida pública', 'Conceitos e classificações'),
  (38, 'Operações de crédito: natureza jurídica', 'Empréstimos públicos'),
  (39, 'Dívida interna, externa e federalismo', 'Gestão da dívida pública'),
  (40, 'Controles da dívida pública na LRF', 'Limites e vedações'),
  (41, 'Fiscalização financeira e orçamentária', 'Controle da execução orçamentária'),
  (42, 'Controle interno e externo', 'Sistemas de controle'),
  (43, 'Tribunais de Contas', 'Competências e atribuições'),
  (44, 'Responsabilidade de agentes públicos', 'Sanções e responsabilização')
) AS t(ordem, titulo, complemento)
WHERE d.codigo = 'DEF0215';

-- Tópicos para DES0223 - Direito Constitucional I (12 tópicos)
INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT d.id, t.ordem, t.titulo, t.complemento, 'pendente'
FROM faculdade_disciplinas d
CROSS JOIN (VALUES
  (1, 'Constitucionalismo e conceito de constituição', 'Evolução histórica e conceitos de constituição'),
  (2, 'Poder constituinte', 'Originário, derivado e difuso'),
  (3, 'Princípios constitucionais', 'Princípios fundamentais da República'),
  (4, 'A eficácia das normas constitucionais', 'Classificação quanto à eficácia'),
  (5, 'Interpretação e aplicação das normas constitucionais', 'Métodos e técnicas de interpretação'),
  (6, 'Os direitos fundamentais e suas gerações', 'Dimensões dos direitos fundamentais'),
  (7, 'Direitos individuais', 'Artigo 5º da Constituição Federal'),
  (8, 'Direitos sociais e políticas públicas', 'Efetivação dos direitos sociais'),
  (9, 'Nacionalidade e direitos políticos', 'Aquisição e perda de nacionalidade'),
  (10, 'Colisões entre direitos fundamentais', 'Razoabilidade e proporcionalidade'),
  (11, 'Garantia dos direitos fundamentais', 'Remédios constitucionais: habeas corpus, mandado de segurança, habeas data'),
  (12, 'Estado de defesa e estado de sítio', 'Sistema constitucional das crises')
) AS t(ordem, titulo, complemento)
WHERE d.codigo = 'DES0223';

-- Tópicos para DFD0215 - Sociologia Jurídica (33 tópicos)
INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT d.id, t.ordem, t.titulo, t.complemento, 'pendente'
FROM faculdade_disciplinas d
CROSS JOIN (VALUES
  (1, 'A abordagem clássica: Durkheim e o direito', 'Solidariedade mecânica e orgânica'),
  (2, 'A abordagem clássica: Marx e o direito', 'Direito como superestrutura'),
  (3, 'A abordagem clássica: Weber e o direito', 'Racionalização e burocracia'),
  (4, 'Paradigmas científicos e senso comum', 'Desafios epistemológicos da sociologia jurídica'),
  (5, 'Direito e modernização reflexiva', 'Beck, Giddens e a modernidade tardia'),
  (6, 'Direito responsivo e direito reflexivo', 'Novas formas de regulação jurídica'),
  (7, 'Direito entre modernidade e pós-modernidade', 'Transformações do direito contemporâneo'),
  (8, 'Direito e estrutura social no pensamento contemporâneo', 'Teorias sociológicas atuais'),
  (9, 'Direito e ordem jurídica liberal', 'Fundamentos do liberalismo jurídico'),
  (10, 'Direito, democracia e Estado de bem-estar social', 'Welfare State e direitos sociais'),
  (11, 'Direito, economia e justiça social', 'Análise econômica do direito'),
  (12, 'Legalidade, eficácia, efetividade e legitimidade', 'Dimensões da ordem jurídica'),
  (13, 'Direito, risco e responsabilidade', 'Sociedade de risco e regulação'),
  (14, 'Direito e desenvolvimento em sociedades complexas', 'Papel do direito no desenvolvimento'),
  (15, 'Mudança social e processo legal', 'A complexificação dos conflitos'),
  (16, 'Direito, exclusão e vulnerabilidade social', 'Acesso à justiça e grupos vulneráveis'),
  (17, 'Os direitos humanos e o sistema de justiça como problema social', 'Desafios da efetivação'),
  (18, 'Direito, protesto e movimentos sociais', 'Juridicização das lutas sociais'),
  (19, 'O Judiciário e os direitos sociais', 'Judicialização da política'),
  (20, 'Pluralismo jurídico e novos tipos de conflito', 'Múltiplas ordens jurídicas'),
  (21, 'A crise do Estado', 'Globalização e padronização das políticas econômicas'),
  (22, 'A globalização e os espaços jurídicos transnacionais', 'Direito global e transnacional'),
  (23, 'Direito e política', 'A juridicização do político'),
  (24, 'Novos usos do direito para a regulação política', 'Instrumentalização do direito'),
  (25, 'O direito e a crise econômica de 2008', 'Regulação e desregulação financeira'),
  (26, 'Comunidade virtual, sociedade em rede e comunicação eletrônica', 'Direito e novas tecnologias'),
  (27, 'O público e o privado na sociedade brasileira', 'Patrimonialismo e personalismo'),
  (28, 'Regulação e burocratização na industrialização brasileira', 'Formação do Estado brasileiro'),
  (29, 'Direito, tecnocracia e modernização autoritária pós-64', 'Regime militar e ordenamento jurídico'),
  (30, 'O direito e a transição democrática nos anos 80', 'Constituição de 1988'),
  (31, 'Era Vargas versus Era Pós-Vargas', 'Reformas nos anos 90'),
  (32, 'Direito, exclusão social e subcidadania no Brasil', 'Jessé Souza e a ralé brasileira'),
  (33, 'Direito e ideologia', 'Ensino jurídico e função social dos juristas')
) AS t(ordem, titulo, complemento)
WHERE d.codigo = 'DFD0215';

-- Tópicos para DPC0215 - Teoria Geral do Processo (28 tópicos)
INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT d.id, t.ordem, t.titulo, t.complemento, 'pendente'
FROM faculdade_disciplinas d
CROSS JOIN (VALUES
  (1, 'Jurisdição: evolução histórica', 'Da autotutela à jurisdição estatal'),
  (2, 'Função jurisdicional e função administrativa', 'Distinção entre jurisdição e administração'),
  (3, 'Função jurisdicional e função legislativa', 'Separação de poderes'),
  (4, 'Conceito atual e classificações de jurisdição', 'Jurisdição contenciosa e voluntária'),
  (5, 'Limites da jurisdição', 'Limites internacionais e internos'),
  (6, 'Jurisdição voluntária', 'Natureza e características'),
  (7, 'Direito material e direito processual', 'Institutos bifrontes'),
  (8, 'Teoria unitária e teoria dualista do direito', 'Relação entre direito e processo'),
  (9, 'Processo: evolução histórica e conceito atual', 'Teorias sobre a natureza do processo'),
  (10, 'Processo e procedimento', 'Distinção conceitual'),
  (11, 'Cognição: conceito e classificações', 'Cognição plena e sumária'),
  (12, 'Cognição e execução', 'Relação entre conhecimento e execução'),
  (13, 'Fases metodológicas do estudo do direito processual', 'Sincretismo, autonomia e instrumentalidade'),
  (14, 'Instrumentalidade do processo', 'O processo como instrumento'),
  (15, 'Autotutela, autocomposição e heterocomposição', 'Formas de solução de conflitos'),
  (16, 'Mediação e conciliação', 'Conceitos gerais e distinções'),
  (17, 'Arbitragem', 'Conceitos gerais e Lei 9.307/96'),
  (18, 'Direito de ação e direito de defesa', 'Teorias clássicas da ação'),
  (19, 'Conceito atual dos direitos de ação e de defesa', 'Direito constitucional de ação'),
  (20, 'Tutela jurisdicional', 'Conceito e classificações'),
  (21, 'Crises do direito material', 'Crises de certeza, situação jurídica e cooperação'),
  (22, 'Tutela constitucional do processo', 'Princípios constitucionais processuais'),
  (23, 'Tutela constitucional pelo processo', 'Remédios constitucionais'),
  (24, 'Sujeitos essenciais à distribuição da justiça', 'Juiz, partes, advogados, Ministério Público'),
  (25, 'Organização judiciária', 'Estrutura do Poder Judiciário'),
  (26, 'Fontes do direito processual', 'Lei, costumes, jurisprudência'),
  (27, 'Eficácia da lei processual no tempo e no espaço', 'Aplicação temporal e territorial'),
  (28, 'Interpretação da lei processual', 'Métodos de interpretação')
) AS t(ordem, titulo, complemento)
WHERE d.codigo = 'DPC0215';

-- Tópicos para DPM0215 - Teoria Geral do Direito Penal I (31 tópicos)
INSERT INTO faculdade_topicos (disciplina_id, ordem, titulo, complemento, status)
SELECT d.id, t.ordem, t.titulo, t.complemento, 'pendente'
FROM faculdade_disciplinas d
CROSS JOIN (VALUES
  (1, 'Direito Penal e Constituição', 'Princípios fundamentais do Direito Penal'),
  (2, 'Aplicação da lei penal no tempo', 'Irretroatividade e retroatividade benéfica'),
  (3, 'Aplicação da lei penal no espaço', 'Territorialidade e extraterritorialidade'),
  (4, 'Interpretação da lei penal', 'Métodos e limites de interpretação'),
  (5, 'Prazos penais', 'Contagem e natureza dos prazos'),
  (6, 'Conflito aparente de normas', 'Princípios da especialidade, subsidiariedade e consunção'),
  (7, 'Teoria geral do delito', 'Conceito analítico de crime'),
  (8, 'Tipicidade: conceito de ação', 'Teorias da ação'),
  (9, 'Crimes comissivos e omissivos', 'Distinção e elementos'),
  (10, 'Resultado e nexo de causalidade', 'Teorias da causalidade'),
  (11, 'Elemento subjetivo do tipo', 'Dolo e culpa'),
  (12, 'Classificações dos tipos penais', 'Crimes materiais, formais e de mera conduta'),
  (13, 'Iter criminis', 'Fases do crime'),
  (14, 'Consumação e tentativa', 'Elementos e punibilidade da tentativa'),
  (15, 'Desistência voluntária e arrependimento eficaz', 'Ponte de ouro'),
  (16, 'Arrependimento posterior', 'Causa de diminuição de pena'),
  (17, 'Crime impossível', 'Tentativa inidônea'),
  (18, 'Antijuridicidade: conceito e causas de justificação', 'Excludentes de ilicitude'),
  (19, 'Legítima defesa', 'Requisitos e excesso'),
  (20, 'Estado de necessidade', 'Requisitos e modalidades'),
  (21, 'Exercício regular de direito', 'Limites do exercício'),
  (22, 'Estrito cumprimento de dever legal', 'Atos praticados por agentes públicos'),
  (23, 'Consentimento do ofendido', 'Natureza e requisitos'),
  (24, 'Culpabilidade', 'Conceito e elementos'),
  (25, 'Imputabilidade penal', 'Critérios e excludentes'),
  (26, 'Inexigibilidade de conduta diversa', 'Fundamento e aplicação'),
  (27, 'Coação irresistível', 'Moral e física'),
  (28, 'Caso fortuito ou força maior', 'Ausência de culpabilidade'),
  (29, 'Erro de tipo', 'Essencial e acidental'),
  (30, 'Erro de proibição', 'Inevitável e evitável'),
  (31, 'Concurso de Pessoas', 'Autoria e participação')
) AS t(ordem, titulo, complemento)
WHERE d.codigo = 'DPM0215';