-- Correção adicional para incisos que não foram pegos (padrões especiais)
UPDATE "CF - Constituição Federal"
SET "Artigo" = 
  regexp_replace(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            regexp_replace(
              "Artigo",
              -- Padrão: "e II -" no meio do texto após ponto-e-vírgula ou ponto
              '([.;]) e (I+ -)', E'\\1\n\n\\2', 'g'
            ),
            -- Alíneas sem ponto-e-vírgula precedendo (após parêntese fecha ou ponto)
            '(\)) (a\))', E'\\1\n\n\\2', 'g'
          ),
          '(\)) (b\))', E'\\1\n\n\\2', 'g'
        ),
        '(\)) (c\))', E'\\1\n\n\\2', 'g'
      ),
      '(\)) (d\))', E'\\1\n\n\\2', 'g'
    ),
    '(\)) (e\))', E'\\1\n\n\\2', 'g'
  )
WHERE "Número do Artigo" IS NOT NULL 
  AND "Artigo" IS NOT NULL;

-- Correção para incisos após "Vigência" (padrão específico da CF)
UPDATE "CF - Constituição Federal"
SET "Artigo" = 
  regexp_replace(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            "Artigo",
            'Vigência (I -)', E'Vigência\n\n\\1', 'g'
          ),
          'Vigência (II -)', E'Vigência\n\n\\1', 'g'
        ),
        'Vigência (III -)', E'Vigência\n\n\\1', 'g'
      ),
      ' IV - § ', E'\n\nIV -\n\n§ ', 'g'
    ),
    '(\.) (§)', E'\\1\n\n\\2', 'g'
  )
WHERE "Número do Artigo" IS NOT NULL 
  AND "Artigo" IS NOT NULL;