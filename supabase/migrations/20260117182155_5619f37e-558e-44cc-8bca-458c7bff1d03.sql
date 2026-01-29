-- Primeiro adicionar a coluna ordem
ALTER TABLE conceitos_materias ADD COLUMN IF NOT EXISTS ordem INTEGER DEFAULT 0;

-- Limpar dados existentes
DELETE FROM conceitos_topicos;
DELETE FROM conceitos_materias;

-- Inserir as 16 matérias (sem usar a coluna ordem diretamente, usar area_ordem como sequência)
INSERT INTO conceitos_materias (nome, codigo, area, area_ordem, ativo, carga_horaria) VALUES
('História do Direito', 'CONC001', 'Trilha Iniciante', 1, true, 28),
('Teoria Geral dos Prazos e Prazos na LINDB', 'CONC002', 'Trilha Iniciante', 2, true, 13),
('Iniciando no Mundo do Direito', 'CONC003', 'Trilha Iniciante', 3, true, 11),
('Introdução ao Estudo do Direito', 'CONC004', 'Trilha Iniciante', 4, true, 43),
('Filosofia do Direito', 'CONC005', 'Trilha Iniciante', 5, true, 46),
('Hans Kelsen', 'CONC006', 'Trilha Iniciante', 6, true, 26),
('Introdução à Sociologia do Direito', 'CONC007', 'Trilha Iniciante', 7, true, 31),
('Direito Romano', 'CONC008', 'Trilha Iniciante', 8, true, 57),
('Teoria Geral dos Direitos Humanos', 'CONC009', 'Trilha Iniciante', 9, true, 18),
('Direitos da Personalidade', 'CONC010', 'Trilha Iniciante', 10, true, 21),
('LINDB', 'CONC011', 'Trilha Iniciante', 11, true, 19),
('Pessoas no Código Civil', 'CONC012', 'Trilha Iniciante', 12, true, 54),
('A Formação do Capitalismo', 'CONC013', 'Trilha Iniciante', 13, true, 10),
('História Constitucional do Brasil', 'CONC014', 'Trilha Iniciante', 14, true, 39),
('Constitucionalismo e Classificação das Constituições', 'CONC015', 'Trilha Iniciante', 15, true, 21),
('Noções Gerais de Direito Penal', 'CONC016', 'Trilha Iniciante', 16, true, 30);