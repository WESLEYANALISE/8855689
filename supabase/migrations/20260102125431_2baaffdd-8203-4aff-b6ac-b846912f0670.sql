INSERT INTO cache_leis_raspadas (nome_tabela, total_artigos, updated_at)
VALUES ('CF - Código Florestal', 129, now())
ON CONFLICT (nome_tabela) DO UPDATE SET 
  total_artigos = 129,
  updated_at = now();