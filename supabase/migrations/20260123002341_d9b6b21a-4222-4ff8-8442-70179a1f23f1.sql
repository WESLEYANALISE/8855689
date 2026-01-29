-- Deletar os tópicos antigos para materia_id = 3
DELETE FROM oab_trilhas_topicos WHERE materia_id = 3;

-- Inserir as 29 matérias de Direito Constitucional
INSERT INTO oab_trilhas_topicos (materia_id, ordem, titulo, status) VALUES
(3, 1, 'Constitucionalismo e Classificação das Constituições', 'pendente'),
(3, 2, 'Poder Constituinte', 'pendente'),
(3, 3, 'Eficácia das Normas Constitucionais', 'pendente'),
(3, 4, 'Espécies de Inconstitucionalidade', 'pendente'),
(3, 5, 'Controle de Constitucionalidade no Brasil', 'pendente'),
(3, 6, 'Controle de Constitucionalidade Difuso', 'pendente'),
(3, 7, 'Controle de Constitucionalidade Concentrado', 'pendente'),
(3, 8, 'Ação Direta de Inconstitucionalidade (ADI): cabimento, competência, legitimidade e efeitos', 'pendente'),
(3, 9, 'ADI Interventiva', 'pendente'),
(3, 10, 'Ação Declaratória de Constitucionalidade (ADC)', 'pendente'),
(3, 11, 'Arguição de Descumprimento de Preceito Fundamental (ADPF)', 'pendente'),
(3, 12, 'Ação Direta de Inconstitucionalidade por Omissão (ADO)', 'pendente'),
(3, 13, 'Súmula Vinculante', 'pendente'),
(3, 14, 'Organização do Estado', 'pendente'),
(3, 15, 'Poder Legislativo', 'pendente'),
(3, 16, 'Comissão Parlamentar de Inquérito (CPI)', 'pendente'),
(3, 17, 'Poder Executivo', 'pendente'),
(3, 18, 'Poder Judiciário', 'pendente'),
(3, 19, 'Ministério Público', 'pendente'),
(3, 20, 'Processo Legislativo', 'pendente'),
(3, 21, 'Funções Essenciais à Justiça', 'pendente'),
(3, 22, 'Defesa do Estado e das Instituições Democráticas', 'pendente'),
(3, 23, 'Direitos e Garantias Fundamentais', 'pendente'),
(3, 24, 'Direitos Sociais', 'pendente'),
(3, 25, 'Nacionalidade', 'pendente'),
(3, 26, 'Direitos Políticos', 'pendente'),
(3, 27, 'Partidos Políticos', 'pendente'),
(3, 28, 'Ordem Social', 'pendente'),
(3, 29, 'Ordem Econômica e Financeira', 'pendente');