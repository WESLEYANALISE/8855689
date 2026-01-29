-- Corrigir o acento de "Portugues" para "Português" na tabela RESUMO
UPDATE "RESUMO" 
SET area = 'Português' 
WHERE area = 'Portugues';

-- Também corrigir na tabela QUESTOES_GERADAS se existir
UPDATE "QUESTOES_GERADAS" 
SET area = 'Português' 
WHERE area = 'Portugues';