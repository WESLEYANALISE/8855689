-- Corrigir "Lindb" para "LINDB" na tabela RESUMO (tema)
UPDATE "RESUMO" 
SET tema = REPLACE(tema, 'Lindb', 'LINDB')
WHERE tema LIKE '%Lindb%';

-- Também corrigir no subtema se existir
UPDATE "RESUMO" 
SET subtema = REPLACE(subtema, 'Lindb', 'LINDB')
WHERE subtema LIKE '%Lindb%';

-- Corrigir na tabela QUESTOES_GERADAS também
UPDATE "QUESTOES_GERADAS" 
SET tema = REPLACE(tema, 'Lindb', 'LINDB')
WHERE tema LIKE '%Lindb%';

UPDATE "QUESTOES_GERADAS" 
SET subtema = REPLACE(subtema, 'Lindb', 'LINDB')
WHERE subtema LIKE '%Lindb%';