-- Limpar capas geradas dos 3 primeiros documentários de Audiodescrição para poder regenerar
UPDATE documentarios_juridicos 
SET capa_webp = NULL 
WHERE id IN (
  '2a3d9571-0d1e-4555-99a6-77af13a1fd85',
  'd2f35359-16ad-43ef-9095-bfbbd5388139',
  'c934c707-4dbb-4539-be05-54c62f7be925'
);