-- Limpar cache de formatação para O Caso dos Exploradores de Cavernas (forçar reprocessamento)
DELETE FROM leitura_paginas_formatadas 
WHERE livro_titulo ILIKE '%Caso dos Exploradores de Cavernas%'
   OR livro_titulo ILIKE '%Espírito das Leis%';

-- Limpar também a tabela leitura_interativa se houver formatação em cache
UPDATE leitura_interativa
SET paginas_formatadas = '{}'::jsonb,
    formatacao_status = 'pendente',
    formatacao_progresso = 0
WHERE biblioteca_classicos_id IN (
  SELECT id FROM "BIBLIOTECA-CLASSICOS" 
  WHERE livro ILIKE '%Caso dos Exploradores de Cavernas%'
     OR livro ILIKE '%Espírito das Leis%'
);