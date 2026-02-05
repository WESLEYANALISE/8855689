-- Inserir tópicos de Direito Processual do Trabalho
INSERT INTO oab_trilhas_topicos (materia_id, titulo, ordem, status, created_at, updated_at)
VALUES 
  (17, 'Introdução ao Processo do Trabalho', 1, 'pendente', now(), now()),
  (17, 'Organização da Justiça do Trabalho', 2, 'pendente', now(), now()),
  (17, 'Competência na Justiça do Trabalho', 3, 'pendente', now(), now()),
  (17, 'Partes e Procuradores no Processo do Trabalho', 4, 'pendente', now(), now()),
  (17, 'Atos e Procedimentos no Processo do Trabalho', 5, 'pendente', now(), now()),
  (17, 'Dissídios Coletivos e Procedimentos Especiais', 6, 'pendente', now(), now()),
  (17, 'Honorários Advocatícios no Processo do Trabalho', 7, 'pendente', now(), now()),
  (17, 'Recursos no Processo do Trabalho', 8, 'pendente', now(), now()),
  (17, 'Execução e Liquidação de Sentença no Processo do Trabalho', 9, 'pendente', now(), now()),
  (17, 'Prática Trabalhista', 10, 'pendente', now(), now())
ON CONFLICT DO NOTHING;