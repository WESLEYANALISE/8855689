-- Corrigir o título "DIREITO do TRABALHO - REVISÃO OAB" para Title Case
UPDATE "RESUMO"
SET tema = 'Direito do Trabalho - Revisão Oab'
WHERE tema = 'DIREITO do TRABALHO - REVISÃO OAB' OR tema = 'DIREITO DO TRABALHO - REVISÃO OAB';

UPDATE "QUESTOES_GERADAS"
SET tema = 'Direito do Trabalho - Revisão Oab'
WHERE tema = 'DIREITO do TRABALHO - REVISÃO OAB' OR tema = 'DIREITO DO TRABALHO - REVISÃO OAB';

-- Corrigir outros títulos que possam estar em caixa alta na área Revisão Oab
UPDATE "RESUMO"
SET tema = 'Processo Civil - Revisão Oab'
WHERE tema = 'PROCESSO CIVIL - REVISÃO OAB';

UPDATE "QUESTOES_GERADAS"
SET tema = 'Processo Civil - Revisão Oab'
WHERE tema = 'PROCESSO CIVIL - REVISÃO OAB';

-- Corrigir qualquer outro título em CAIXA ALTA na área Revisão Oab
UPDATE "RESUMO"
SET tema = INITCAP(tema)
WHERE area = 'Revisão Oab' 
  AND tema ~ '^[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ\s\-]+$'
  AND length(tema) > 5;