-- Corrigir formatação de artigos da Constituição Federal
-- Adicionar quebras de linha antes de parágrafos (§), incisos (I -, II -, etc.) e alíneas (a), b), etc.)

UPDATE "CF - Constituição Federal"
SET "Artigo" = 
  -- Primeiro: quebra antes de parágrafos (§)
  regexp_replace(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            regexp_replace(
              regexp_replace(
                regexp_replace(
                  regexp_replace(
                    regexp_replace(
                      regexp_replace(
                        regexp_replace(
                          regexp_replace(
                            regexp_replace(
                              regexp_replace(
                                regexp_replace(
                                  regexp_replace(
                                    regexp_replace(
                                      -- Quebra antes de § (parágrafos)
                                      regexp_replace("Artigo", '([.;:]) (§ [0-9º°]+)', E'\\1\n\n\\2', 'g'),
                                      -- Parágrafo único
                                      '([.;:]) (Parágrafo único)', E'\\1\n\n\\2', 'g'
                                    ),
                                    -- Quebra antes de incisos romanos I - até XXX -
                                    '([.;:]) (I -)', E'\\1\n\n\\2', 'g'
                                  ),
                                  '([.;:]) (II -)', E'\\1\n\n\\2', 'g'
                                ),
                                '([.;:]) (III -)', E'\\1\n\n\\2', 'g'
                              ),
                              '([.;:]) (IV -)', E'\\1\n\n\\2', 'g'
                            ),
                            '([.;:]) (V -)', E'\\1\n\n\\2', 'g'
                          ),
                          '([.;:]) (VI -)', E'\\1\n\n\\2', 'g'
                        ),
                        '([.;:]) (VII -)', E'\\1\n\n\\2', 'g'
                      ),
                      '([.;:]) (VIII -)', E'\\1\n\n\\2', 'g'
                    ),
                    '([.;:]) (IX -)', E'\\1\n\n\\2', 'g'
                  ),
                  '([.;:]) (X -)', E'\\1\n\n\\2', 'g'
                ),
                '([.;:]) (XI -)', E'\\1\n\n\\2', 'g'
              ),
              '([.;:]) (XII -)', E'\\1\n\n\\2', 'g'
            ),
            '([.;:]) (XIII -)', E'\\1\n\n\\2', 'g'
          ),
          '([.;:]) (XIV -)', E'\\1\n\n\\2', 'g'
        ),
        '([.;:]) (XV -)', E'\\1\n\n\\2', 'g'
      ),
      '([.;:]) (XVI -)', E'\\1\n\n\\2', 'g'
    ),
    '([.;:]) (XVII -)', E'\\1\n\n\\2', 'g'
  )
WHERE "Número do Artigo" IS NOT NULL 
  AND "Artigo" IS NOT NULL
  AND "Artigo" NOT LIKE '%' || chr(10) || '%';

-- Segunda passada para incisos XVIII até LXXX e alíneas
UPDATE "CF - Constituição Federal"
SET "Artigo" = 
  regexp_replace(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            regexp_replace(
              regexp_replace(
                regexp_replace(
                  regexp_replace(
                    regexp_replace(
                      regexp_replace(
                        regexp_replace(
                          regexp_replace(
                            regexp_replace(
                              regexp_replace(
                                "Artigo",
                                '([.;:]) (XVIII -)', E'\\1\n\n\\2', 'g'
                              ),
                              '([.;:]) (XIX -)', E'\\1\n\n\\2', 'g'
                            ),
                            '([.;:]) (XX -)', E'\\1\n\n\\2', 'g'
                          ),
                          '([.;:]) (XXI -)', E'\\1\n\n\\2', 'g'
                        ),
                        '([.;:]) (XXII -)', E'\\1\n\n\\2', 'g'
                      ),
                      '([.;:]) (XXIII -)', E'\\1\n\n\\2', 'g'
                    ),
                    '([.;:]) (XXIV -)', E'\\1\n\n\\2', 'g'
                  ),
                  '([.;:]) (XXV -)', E'\\1\n\n\\2', 'g'
                ),
                '([.;:]) (XXVI -)', E'\\1\n\n\\2', 'g'
              ),
              '([.;:]) (XXVII -)', E'\\1\n\n\\2', 'g'
            ),
            '([.;:]) (XXVIII -)', E'\\1\n\n\\2', 'g'
          ),
          '([.;:]) (XXIX -)', E'\\1\n\n\\2', 'g'
        ),
        '([.;:]) (XXX -)', E'\\1\n\n\\2', 'g'
      ),
      '([.;:]) (XXXI -)', E'\\1\n\n\\2', 'g'
    ),
    '([.;:]) (XXXII -)', E'\\1\n\n\\2', 'g'
  )
WHERE "Número do Artigo" IS NOT NULL 
  AND "Artigo" IS NOT NULL;

-- Terceira passada para mais incisos e alíneas
UPDATE "CF - Constituição Federal"
SET "Artigo" = 
  regexp_replace(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            regexp_replace(
              regexp_replace(
                regexp_replace(
                  regexp_replace(
                    regexp_replace(
                      regexp_replace(
                        regexp_replace(
                          "Artigo",
                          '([;]) (a\))', E'\\1\n\n\\2', 'g'
                        ),
                        '([;]) (b\))', E'\\1\n\n\\2', 'g'
                      ),
                      '([;]) (c\))', E'\\1\n\n\\2', 'g'
                    ),
                    '([;]) (d\))', E'\\1\n\n\\2', 'g'
                  ),
                  '([;]) (e\))', E'\\1\n\n\\2', 'g'
                ),
                '([;]) (f\))', E'\\1\n\n\\2', 'g'
              ),
              '([;]) (g\))', E'\\1\n\n\\2', 'g'
            ),
            '([;]) (h\))', E'\\1\n\n\\2', 'g'
          ),
          '([;]) (i\))', E'\\1\n\n\\2', 'g'
        ),
        '([;]) (j\))', E'\\1\n\n\\2', 'g'
      ),
      '([;]) (k\))', E'\\1\n\n\\2', 'g'
    ),
    '([;]) (l\))', E'\\1\n\n\\2', 'g'
  )
WHERE "Número do Artigo" IS NOT NULL 
  AND "Artigo" IS NOT NULL;