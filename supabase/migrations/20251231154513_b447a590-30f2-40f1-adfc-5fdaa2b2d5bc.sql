-- Atualizar ementas truncadas na resenha_diaria com os dados corretos de leis_push_2025
UPDATE resenha_diaria r
SET ementa = l.ementa
FROM leis_push_2025 l
WHERE r.numero_lei = l.numero_lei
  AND l.ementa IS NOT NULL
  AND LENGTH(l.ementa) > LENGTH(r.ementa)
  AND LENGTH(r.ementa) < 50;