-- Limpar matérias existentes e inserir as corretas
DELETE FROM conceitos_materias;

INSERT INTO conceitos_materias (area, area_ordem, codigo, nome, ementa, ordem, ativo, status_processamento, created_at)
VALUES 
  ('Fundamentos', 1, 'HIST', 'História do Direito', 'Evolução histórica do Direito e suas instituições', 1, true, 'pendente', now()),
  ('Fundamentos', 1, 'IED', 'Introdução ao Estudo do Direito', 'Conceitos fundamentais da ciência jurídica', 2, true, 'pendente', now()),
  ('Fundamentos', 1, 'FILO', 'Filosofia do Direito', 'Fundamentos filosóficos do pensamento jurídico', 3, true, 'pendente', now()),
  ('Fundamentos', 1, 'KELSEN', 'Hans Kelsen', 'Teoria Pura do Direito e normativismo jurídico', 4, true, 'pendente', now()),
  ('Fundamentos', 1, 'SOCIO', 'Introdução à Sociologia do Direito', 'Relações entre sociedade e ordenamento jurídico', 5, true, 'pendente', now()),
  ('Fundamentos', 1, 'ROMANO', 'Direito Romano', 'Bases do Direito Romano e sua influência moderna', 6, true, 'pendente', now()),
  ('Direitos Fundamentais', 2, 'TGDH', 'Teoria Geral dos Direitos Humanos', 'Fundamentos e proteção dos direitos humanos', 1, true, 'pendente', now()),
  ('Direitos Fundamentais', 2, 'DPERS', 'Direitos da Personalidade', 'Proteção dos direitos inerentes à pessoa', 2, true, 'pendente', now()),
  ('Direito Civil', 3, 'LINDB', 'LINDB', 'Lei de Introdução às Normas do Direito Brasileiro', 1, true, 'pendente', now()),
  ('Direito Civil', 3, 'PESSOAS', 'Pessoas no Código Civil', 'Teoria das pessoas naturais e jurídicas', 2, true, 'pendente', now()),
  ('Direito e Sociedade', 4, 'CAPITAL', 'A Formação do Capitalismo', 'Relações entre Direito e sistema econômico', 1, true, 'pendente', now()),
  ('Direito Constitucional', 5, 'HISTCONST', 'História Constitucional do Brasil', 'Evolução das constituições brasileiras', 1, true, 'pendente', now()),
  ('Direito Constitucional', 5, 'CONSTIT', 'Constitucionalismo e Classificação das Constituições', 'Teoria constitucional e tipologia', 2, true, 'pendente', now()),
  ('Direito Penal', 6, 'NGPENAL', 'Noções Gerais de Direito Penal', 'Introdução aos fundamentos do Direito Penal', 1, true, 'pendente', now());