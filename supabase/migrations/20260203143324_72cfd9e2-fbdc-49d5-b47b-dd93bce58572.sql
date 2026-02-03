-- Deletar todos os tópicos atuais da matéria 37
DELETE FROM oab_trilhas_topicos WHERE materia_id = 37;

-- Inserir apenas os 5 tópicos solicitados
INSERT INTO oab_trilhas_topicos (materia_id, titulo, ordem, status, created_at, updated_at) VALUES
(37, 'Filosofia do Direito', 1, 'pendente', now(), now()),
(37, 'Filosofia do Direito na Antiguidade', 2, 'pendente', now(), now()),
(37, 'Filosofia do Direito na Modernidade', 3, 'pendente', now(), now()),
(37, 'Hans Kelsen', 4, 'pendente', now(), now()),
(37, 'Hermenêutica e Métodos Interpretativos', 5, 'pendente', now(), now());