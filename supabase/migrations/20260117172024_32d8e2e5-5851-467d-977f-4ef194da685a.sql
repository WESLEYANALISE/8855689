-- =============================================
-- MIGRAÇÃO: Adicionar disciplina do 9º Semestre
-- Curso: Direito USP (2014)
-- =============================================

-- Inserir disciplina do 9º semestre
INSERT INTO faculdade_disciplinas (
  codigo,
  nome,
  nome_ingles,
  departamento,
  semestre,
  carga_horaria,
  ementa,
  objetivos,
  conteudo_programatico,
  url_jupiter,
  ativo
) VALUES (
  '0200116',
  'Trabalho de Conclusão de Curso II',
  'Completion of Course Work II',
  'Faculdade de Direito',
  9,
  120,
  'Trabalhos individuais entregues obrigatoriamente, com atribuição de nota pela banca examinadora.',
  'A elaboração e defesa da Tese de Láurea tem por fim proporcionar ao aluno de graduação em Direito a oportunidade de demonstrar os conhecimentos adquiridos, a aptidão para a pesquisa e a capacidade de interpretação e crítica sobre o tema desenvolvido e apresentado. Trata-se de medida que promoverá a integração entre os três pilares universitários.',
  'Disciplina prática de orientação individual. Elaboração e defesa da monografia final (Tese de Láurea) perante banca examinadora. Requisito: TCC I (0200115). Avaliação: trabalho escrito e defesa oral.',
  'https://uspdigital.usp.br/jupiterweb/obterDisciplina?sgldis=0200116&codcur=2014&codhab=104',
  true
);

-- Nota: Esta disciplina é prática (orientação individual para monografia)
-- Portanto, NÃO possui tópicos teóricos para inserção na tabela faculdade_topicos