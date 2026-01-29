-- Ajustar tabela jogos_juridicos para usar apenas temas (remover artigos)

-- 1. Remover constraint única antiga (ao invés do índice)
ALTER TABLE jogos_juridicos 
DROP CONSTRAINT IF EXISTS jogos_juridicos_tipo_fonte_tipo_fonte_id_dificuldade_key;

-- 2. Adicionar novas colunas area e tema
ALTER TABLE jogos_juridicos 
ADD COLUMN IF NOT EXISTS area text,
ADD COLUMN IF NOT EXISTS tema text;

-- 3. Migrar dados existentes (se houver) - extrair de fonte_nome
UPDATE jogos_juridicos
SET 
  area = COALESCE(SPLIT_PART(fonte_nome, '(', 2), 'Direito Geral'),
  tema = COALESCE(SPLIT_PART(SPLIT_PART(fonte_nome, '(', 1), ' - ', 1), 'Geral')
WHERE area IS NULL AND tema IS NULL;

-- Limpar parênteses do area
UPDATE jogos_juridicos
SET area = REPLACE(REPLACE(area, '(', ''), ')', '')
WHERE area LIKE '%(%';

-- 4. Tornar colunas NOT NULL
ALTER TABLE jogos_juridicos 
ALTER COLUMN area SET NOT NULL,
ALTER COLUMN tema SET NOT NULL;

-- 5. Remover colunas antigas
ALTER TABLE jogos_juridicos 
DROP COLUMN IF EXISTS fonte_tipo,
DROP COLUMN IF EXISTS fonte_id,
DROP COLUMN IF EXISTS fonte_nome;

-- 6. Criar nova constraint única
ALTER TABLE jogos_juridicos 
ADD CONSTRAINT jogos_juridicos_tipo_area_tema_dificuldade_key 
UNIQUE (tipo, area, tema, dificuldade);