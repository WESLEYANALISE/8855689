-- ============================================
-- CORREÇÃO COMPLETA DO CPM
-- 1. Adicionar 86 títulos faltantes
-- 2. Corrigir alíneas desalinhadas
-- ============================================

-- PARTE 1: Corrigir alíneas desalinhadas (rápido e seguro)
-- Transforma "\n\n[letra])\n\n" em "\n\n[letra]) "
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = REGEXP_REPLACE("Artigo", E'\\n\\n([a-z])\\)\\n\\n', E'\n\n\\1) ', 'g')
WHERE "Artigo" ~ E'\\n\\n[a-z]\\)\\n\\n';

-- PARTE 2: Adicionar os 86 títulos faltantes
-- Cada UPDATE adiciona o título correto no início do artigo

-- Art. 2
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Lei supressiva de incriminação' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '2'
  AND "Artigo" ~ '^Art\.';

-- Art. 6
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Lugar do crime' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '6'
  AND "Artigo" ~ '^Art\.';

-- Art. 8
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Pena cumprida no estrangeiro' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '8'
  AND "Artigo" ~ '^Art\.';

-- Art. 19
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Infrações disciplinares' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '19'
  AND "Artigo" ~ '^Art\.';

-- Art. 29
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Relação de causalidade' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '29'
  AND "Artigo" ~ '^Art\.';

-- Art. 30
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Consumação e tentativa' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '30'
  AND "Artigo" ~ '^Art\.';

-- Art. 33
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Culpabilidade' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '33'
  AND "Artigo" ~ '^Art\.';

-- Art. 37
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Erro sobre a pessoa' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '37'
  AND "Artigo" ~ '^Art\.';

-- Art. 38
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Coação irresistível e obediência hierárquica' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '38'
  AND "Artigo" ~ '^Art\.';

-- Art. 48
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Concurso de agentes' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '48'
  AND "Artigo" ~ '^Art\.';

-- Art. 52
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Crimes conexos' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '52'
  AND "Artigo" ~ '^Art\.';

-- Art. 53
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Conflito aparente de normas' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '53'
  AND "Artigo" ~ '^Art\.';

-- Art. 55
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Penas principais' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '55'
  AND "Artigo" ~ '^Art\.';

-- Art. 60
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Fixação da pena de multa' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '60'
  AND "Artigo" ~ '^Art\.';

-- Art. 69
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Penas acessórias' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '69'
  AND "Artigo" ~ '^Art\.';

-- Art. 70
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Indignidade ou incompatibilidade com o oficialato' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '70'
  AND "Artigo" ~ '^Art\.';

-- Art. 72
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Pena acessória para praça' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '72'
  AND "Artigo" ~ '^Art\.';

-- Art. 84
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Reincidência' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '84'
  AND "Artigo" ~ '^Art\.';

-- Art. 88
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Aplicação das medidas de segurança' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '88'
  AND "Artigo" ~ '^Art\.';

-- Art. 89
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Internação em manicômio judiciário' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '89'
  AND "Artigo" ~ '^Art\.';

-- Art. 91
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Cassação de licença para dirigir' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '91'
  AND "Artigo" ~ '^Art\.';

-- Art. 97
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Extinção da punibilidade' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '97'
  AND "Artigo" ~ '^Art\.';

-- Art. 98
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Morte do agente' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '98'
  AND "Artigo" ~ '^Art\.';

-- Art. 109
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Prescrição da pretensão punitiva' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '109'
  AND "Artigo" ~ '^Art\.';

-- Art. 110
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Termo inicial da prescrição' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '110'
  AND "Artigo" ~ '^Art\.';

-- Art. 112
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Suspensão do prazo prescricional' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '112'
  AND "Artigo" ~ '^Art\.';

-- Art. 116
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Prescrição da execução da pena' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '116'
  AND "Artigo" ~ '^Art\.';

-- Art. 118
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Perdão judicial' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '118'
  AND "Artigo" ~ '^Art\.';

-- Art. 119
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Anistia e indulto' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '119'
  AND "Artigo" ~ '^Art\.';

-- Art. 120
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Efeitos da anistia' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '120'
  AND "Artigo" ~ '^Art\.';

-- Art. 121
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Efeitos do indulto' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '121'
  AND "Artigo" ~ '^Art\.';

-- Art. 122
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Abuso de poder ou violação do dever' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '122'
  AND "Artigo" ~ '^Art\.';

-- Art. 123
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Exposição a perigo da tropa' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '123'
  AND "Artigo" ~ '^Art\.';

-- Art. 143
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Motim' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '143'
  AND "Artigo" ~ '^Art\.';

-- Art. 144
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Revolta' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '144'
  AND "Artigo" ~ '^Art\.';

-- Art. 145
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Conspiração' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '145'
  AND "Artigo" ~ '^Art\.';

-- Art. 147
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Aliciação para motim ou revolta' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '147'
  AND "Artigo" ~ '^Art\.';

-- Art. 154
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Recusa de obediência' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '154'
  AND "Artigo" ~ '^Art\.';

-- Art. 160
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Violência contra superior ou militar de serviço' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '160'
  AND "Artigo" ~ '^Art\.';

-- Art. 163
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Desrespeito a superior' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '163'
  AND "Artigo" ~ '^Art\.';

-- Art. 166
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Insubordinação' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '166'
  AND "Artigo" ~ '^Art\.';

-- Art. 175
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Deserção' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '175'
  AND "Artigo" ~ '^Art\.';

-- Art. 178
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Descaminho de recrutado ou desertado' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '178'
  AND "Artigo" ~ '^Art\.';

-- Art. 183
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Abandono de posto' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '183'
  AND "Artigo" ~ '^Art\.';

-- Art. 187
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Dormir em serviço' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '187'
  AND "Artigo" ~ '^Art\.';

-- Art. 189
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Embriaguez em serviço' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '189'
  AND "Artigo" ~ '^Art\.';

-- Art. 190
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Descumprimento de missão' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '190'
  AND "Artigo" ~ '^Art\.';

-- Art. 194
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Covardia' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '194'
  AND "Artigo" ~ '^Art\.';

-- Art. 206
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Violência contra inferior' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '206'
  AND "Artigo" ~ '^Art\.';

-- Art. 208
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Rixa' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '208'
  AND "Artigo" ~ '^Art\.';

-- Art. 212
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Homicídio simples' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '212'
  AND "Artigo" ~ '^Art\.';

-- Art. 215
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Induzimento a suicídio' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '215'
  AND "Artigo" ~ '^Art\.';

-- Art. 220
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Lesão corporal' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '220'
  AND "Artigo" ~ '^Art\.';

-- Art. 222
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Perigo de contágio de moléstia grave' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '222'
  AND "Artigo" ~ '^Art\.';

-- Art. 228
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Calúnia' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '228'
  AND "Artigo" ~ '^Art\.';

-- Art. 232
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Ameaça' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '232'
  AND "Artigo" ~ '^Art\.';

-- Art. 239
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Peculato' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '239'
  AND "Artigo" ~ '^Art\.';

-- Art. 240
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Peculato mediante erro de outrem' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '240'
  AND "Artigo" ~ '^Art\.';

-- Art. 246
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Concussão' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '246'
  AND "Artigo" ~ '^Art\.';

-- Art. 248
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Corrupção passiva' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '248'
  AND "Artigo" ~ '^Art\.';

-- Art. 250
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Facilitação de contrabando ou descaminho' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '250'
  AND "Artigo" ~ '^Art\.';

-- Art. 251
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Prevaricação' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '251'
  AND "Artigo" ~ '^Art\.';

-- Art. 254
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Condescendência criminosa' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '254'
  AND "Artigo" ~ '^Art\.';

-- Art. 257
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Advocacia administrativa' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '257'
  AND "Artigo" ~ '^Art\.';

-- Art. 267
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Violência arbitrária' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '267'
  AND "Artigo" ~ '^Art\.';

-- Art. 268
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Abandono de função' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '268'
  AND "Artigo" ~ '^Art\.';

-- Art. 271
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Resistência' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '271'
  AND "Artigo" ~ '^Art\.';

-- Art. 282
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Falso testemunho ou falsa perícia' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '282'
  AND "Artigo" ~ '^Art\.';

-- Art. 290
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Favorecimento pessoal' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '290'
  AND "Artigo" ~ '^Art\.';

-- Art. 293
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Fraude processual' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '293'
  AND "Artigo" ~ '^Art\.';

-- Art. 303
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Furto' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '303'
  AND "Artigo" ~ '^Art\.';

-- Art. 311
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Dano' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '311'
  AND "Artigo" ~ '^Art\.';

-- Art. 313
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Apropriação indébita' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '313'
  AND "Artigo" ~ '^Art\.';

-- Art. 315
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Estelionato' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '315'
  AND "Artigo" ~ '^Art\.';

-- Art. 319
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Receptação' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '319'
  AND "Artigo" ~ '^Art\.';

-- Art. 323
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Moeda falsa' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '323'
  AND "Artigo" ~ '^Art\.';

-- Art. 340
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Falsificação de documento' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '340'
  AND "Artigo" ~ '^Art\.';

-- Art. 344
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Uso de documento falso' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '344'
  AND "Artigo" ~ '^Art\.';

-- Art. 347
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Supressão de documento' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '347'
  AND "Artigo" ~ '^Art\.';

-- Art. 351
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Corrupção ativa' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '351'
  AND "Artigo" ~ '^Art\.';

-- Art. 356
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Contrabando' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '356'
  AND "Artigo" ~ '^Art\.';

-- Art. 363
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Lenocínio' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '363'
  AND "Artigo" ~ '^Art\.';

-- Art. 372
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Posse, comércio ou uso de entorpecente' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '372'
  AND "Artigo" ~ '^Art\.';

-- Art. 391
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Rufianismo' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '391'
  AND "Artigo" ~ '^Art\.';

-- Art. 394
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Ato obsceno' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '394'
  AND "Artigo" ~ '^Art\.';

-- Art. 400
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Insubmissão' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '400'
  AND "Artigo" ~ '^Art\.';

-- Art. 404
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Motim de presos' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '404'
  AND "Artigo" ~ '^Art\.';

-- Art. 406
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Arrebatamento de preso' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '406'
  AND "Artigo" ~ '^Art\.';

-- Art. 410
UPDATE "CPM – Código Penal Militar"
SET "Artigo" = 'Exercício funcional ilegalmente antecipado ou prolongado' || E'\n\n' || "Artigo"
WHERE "Número do Artigo" = '410'
  AND "Artigo" ~ '^Art\.';

-- VALIDAÇÃO FINAL
DO $$
DECLARE
  total_artigos INTEGER;
  artigos_sem_titulo INTEGER;
  alineas_desalinhadas INTEGER;
BEGIN
  -- Contar total de artigos
  SELECT COUNT(*) INTO total_artigos
  FROM "CPM – Código Penal Militar"
  WHERE "Número do Artigo" IS NOT NULL;
  
  -- Contar artigos que ainda começam com "Art." (sem título)
  SELECT COUNT(*) INTO artigos_sem_titulo
  FROM "CPM – Código Penal Militar"
  WHERE "Número do Artigo" IS NOT NULL
    AND "Artigo" ~ '^Art\.';
  
  -- Contar alíneas ainda desalinhadas
  SELECT COUNT(*) INTO alineas_desalinhadas
  FROM "CPM – Código Penal Militar"
  WHERE "Artigo" ~ E'\\n\\n[a-z]\\)\\n\\n';
  
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ CORREÇÃO COMPLETA DO CPM FINALIZADA!';
  RAISE NOTICE '================================================';
  RAISE NOTICE '📊 Total de artigos: %', total_artigos;
  RAISE NOTICE '📝 Artigos ainda sem título: %', artigos_sem_titulo;
  RAISE NOTICE '🔧 Alíneas desalinhadas restantes: %', alineas_desalinhadas;
  RAISE NOTICE '================================================';
  
  IF artigos_sem_titulo = 0 AND alineas_desalinhadas = 0 THEN
    RAISE NOTICE '🎉 SUCESSO! Todos os artigos estão com títulos e alíneas corrigidas!';
  ELSE
    RAISE WARNING '⚠️ Ainda existem % artigos sem título', artigos_sem_titulo;
  END IF;
  
  RAISE NOTICE '================================================';
END $$;