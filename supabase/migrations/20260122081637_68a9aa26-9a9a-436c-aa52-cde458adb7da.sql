-- Restaurar as matérias de conceitos que foram deletadas por engano
INSERT INTO conceitos_materias (area, area_ordem, codigo, nome, ementa, ordem, ativo, status_processamento, created_at)
VALUES 
  ('Fundamentos', 1, 'IED', 'Introdução ao Estudo do Direito', 'Fundamentos essenciais para compreender o ordenamento jurídico brasileiro', 1, true, 'pendente', now()),
  ('Direito Público', 2, 'DCONST', 'Direito Constitucional', 'Princípios e normas da Constituição Federal', 1, true, 'pendente', now()),
  ('Direito Privado', 3, 'DCIVIL', 'Direito Civil', 'Relações jurídicas entre particulares', 1, true, 'pendente', now()),
  ('Direito Público', 2, 'DPENAL', 'Direito Penal', 'Crimes e penas no ordenamento brasileiro', 2, true, 'pendente', now()),
  ('Direito Público', 2, 'DADM', 'Direito Administrativo', 'Organização e funcionamento da administração pública', 3, true, 'pendente', now()),
  ('Direito Privado', 3, 'DTRAB', 'Direito do Trabalho', 'Relações de emprego e direitos trabalhistas', 2, true, 'pendente', now()),
  ('Processual', 4, 'DPC', 'Direito Processual Civil', 'Procedimentos e recursos no processo civil', 1, true, 'pendente', now()),
  ('Processual', 4, 'DPP', 'Direito Processual Penal', 'Procedimentos e recursos no processo penal', 2, true, 'pendente', now()),
  ('Direito Público', 2, 'DTRIB', 'Direito Tributário', 'Tributos e obrigações fiscais', 4, true, 'pendente', now()),
  ('Direito Privado', 3, 'DEMP', 'Direito Empresarial', 'Atividade empresarial e sociedades', 3, true, 'pendente', now());