-- Restaurar a matéria Filosofia do Direito (colunas corretas)
INSERT INTO oab_trilhas_materias (id, nome, ordem, ativo, created_at, updated_at)
VALUES (37, 'Filosofia do Direito', 21, true, now(), now())
ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, ativo = true, updated_at = now();