INSERT INTO cache_leis_raspadas (nome_tabela, total_artigos, updated_at)
VALUES 
  ('CE – Código Eleitoral', 476, NOW()),
  ('CC - Código de Caça', 43, NOW())
ON CONFLICT (nome_tabela) DO UPDATE SET 
  total_artigos = EXCLUDED.total_artigos,
  updated_at = NOW();