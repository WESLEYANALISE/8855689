-- Deletar todos os tópicos atuais de Direito Financeiro (ID 36)
DELETE FROM oab_trilhas_topicos WHERE materia_id = 36;

-- Inserir os 9 tópicos solicitados
INSERT INTO oab_trilhas_topicos (materia_id, titulo, ordem, status, created_at, updated_at) VALUES
(36, 'Introdução ao Direito Financeiro', 1, 'pendente', now(), now()),
(36, 'Fontes e Normas Gerais do Direito Financeiro', 2, 'pendente', now(), now()),
(36, 'Direito Financeiro', 3, 'pendente', now(), now()),
(36, 'Receitas Públicas', 4, 'pendente', now(), now()),
(36, 'Despesas e Gastos Públicos', 5, 'pendente', now(), now()),
(36, 'Orçamento Público', 6, 'pendente', now(), now()),
(36, 'Federalismo Fiscal', 7, 'pendente', now(), now()),
(36, 'Crédito e Dívida Pública no Direito Financeiro', 8, 'pendente', now(), now()),
(36, 'Fiscalização Financeira e Orçamentária', 9, 'pendente', now(), now());