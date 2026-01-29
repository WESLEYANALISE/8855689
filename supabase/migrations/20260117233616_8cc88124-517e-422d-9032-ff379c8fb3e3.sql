-- Apagar "Iniciando no Mundo do Direito" (codigo CONC003)
DELETE FROM conceitos_materias WHERE codigo = 'CONC003';

-- Ajustar ordem das matérias:
-- História do Direito = tema 1, Introdução ao Estudo do Direito = tema 2, Teoria Geral dos Prazos = tema 3
UPDATE conceitos_materias SET area_ordem = 1 WHERE codigo = 'CONC001';
UPDATE conceitos_materias SET area_ordem = 2 WHERE codigo = 'CONC004';
UPDATE conceitos_materias SET area_ordem = 3 WHERE codigo = 'CONC002';
UPDATE conceitos_materias SET area_ordem = 4 WHERE codigo = 'CONC005';
UPDATE conceitos_materias SET area_ordem = 5 WHERE codigo = 'CONC006';
UPDATE conceitos_materias SET area_ordem = 6 WHERE codigo = 'CONC007';
UPDATE conceitos_materias SET area_ordem = 7 WHERE codigo = 'CONC008';
UPDATE conceitos_materias SET area_ordem = 8 WHERE codigo = 'CONC009';
UPDATE conceitos_materias SET area_ordem = 9 WHERE codigo = 'CONC010';
UPDATE conceitos_materias SET area_ordem = 10 WHERE codigo = 'CONC011';
UPDATE conceitos_materias SET area_ordem = 11 WHERE codigo = 'CONC012';
UPDATE conceitos_materias SET area_ordem = 12 WHERE codigo = 'CONC013';
UPDATE conceitos_materias SET area_ordem = 13 WHERE codigo = 'CONC014';
UPDATE conceitos_materias SET area_ordem = 14 WHERE codigo = 'CONC015';
UPDATE conceitos_materias SET area_ordem = 15 WHERE codigo = 'CONC016';