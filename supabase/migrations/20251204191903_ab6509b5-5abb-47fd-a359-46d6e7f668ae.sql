-- Corrigir títulos da área "Revisão Oab" que estão em caixa alta ou com palavras separadas incorretamente
-- Primeiro, corrigir os problemas de caracteres separados (ex: REVISÃ O → REVISÃO, EXTINÇ ÃO → EXTINÇÃO)
UPDATE "RESUMO"
SET tema = REPLACE(tema, 'REVISÃ O', 'REVISÃO')
WHERE tema LIKE '%REVISÃ O%';

UPDATE "RESUMO"
SET tema = REPLACE(tema, 'EXTINÇ ÃO', 'EXTINÇÃO')
WHERE tema LIKE '%EXTINÇ ÃO%';

UPDATE "RESUMO"
SET tema = REPLACE(tema, 'Ç ÃO', 'ÇÃO')
WHERE tema LIKE '%Ç ÃO%';

UPDATE "RESUMO"
SET tema = REPLACE(tema, 'Ã O', 'ÃO')
WHERE tema LIKE '%Ã O%';

-- Agora corrigir os títulos que estão em CAIXA ALTA para Title Case na área Revisão Oab
-- Lista de títulos específicos para corrigir:

UPDATE "RESUMO"
SET tema = 'Principais Crimes - Revisão Oab'
WHERE tema = 'PRINCIPAIS CRIMES - REVISÃ O OAB' OR tema = 'PRINCIPAIS CRIMES - REVISÃO OAB';

UPDATE "RESUMO"
SET tema = 'Extinção da Punibilidade - Revisão Oab'
WHERE tema = 'EXTINÇ ÃO da PUNIBILIDADE - REVISÃ O OAB' OR tema = 'EXTINÇÃO DA PUNIBILIDADE - REVISÃO OAB' OR tema = 'EXTINÇÃO da PUNIBILIDADE - REVISÃO OAB';

UPDATE "RESUMO"
SET tema = 'Direito Civil - Revisão Oab'
WHERE tema = 'DIREITO CIVIL - REVISÃ O OAB' OR tema = 'DIREITO CIVIL - REVISÃO OAB';

-- Corrigir qualquer outro título em caixa alta que termine com "- REVISÃO OAB" ou similar
UPDATE "RESUMO"
SET tema = INITCAP(REPLACE(tema, ' - REVISÃO OAB', '')) || ' - Revisão Oab'
WHERE area = 'Revisão Oab' 
  AND tema ~ '^[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ\s]+ - REVISÃO OAB$';

-- Também corrigir na tabela QUESTOES_GERADAS para manter consistência
UPDATE "QUESTOES_GERADAS"
SET tema = REPLACE(tema, 'REVISÃ O', 'REVISÃO')
WHERE tema LIKE '%REVISÃ O%';

UPDATE "QUESTOES_GERADAS"
SET tema = REPLACE(tema, 'EXTINÇ ÃO', 'EXTINÇÃO')
WHERE tema LIKE '%EXTINÇ ÃO%';

UPDATE "QUESTOES_GERADAS"
SET tema = REPLACE(tema, 'Ç ÃO', 'ÇÃO')
WHERE tema LIKE '%Ç ÃO%';

UPDATE "QUESTOES_GERADAS"
SET tema = REPLACE(tema, 'Ã O', 'ÃO')
WHERE tema LIKE '%Ã O%';

UPDATE "QUESTOES_GERADAS"
SET tema = 'Principais Crimes - Revisão Oab'
WHERE tema = 'PRINCIPAIS CRIMES - REVISÃ O OAB' OR tema = 'PRINCIPAIS CRIMES - REVISÃO OAB';

UPDATE "QUESTOES_GERADAS"
SET tema = 'Extinção da Punibilidade - Revisão Oab'
WHERE tema = 'EXTINÇ ÃO da PUNIBILIDADE - REVISÃ O OAB' OR tema = 'EXTINÇÃO DA PUNIBILIDADE - REVISÃO OAB' OR tema = 'EXTINÇÃO da PUNIBILIDADE - REVISÃO OAB';

UPDATE "QUESTOES_GERADAS"
SET tema = 'Direito Civil - Revisão Oab'
WHERE tema = 'DIREITO CIVIL - REVISÃ O OAB' OR tema = 'DIREITO CIVIL - REVISÃO OAB';