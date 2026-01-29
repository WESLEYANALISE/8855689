-- Adicionar coluna de ordenação para corrigir a estrutura da LEP
ALTER TABLE "Lei 7.210 de 1984 - Lei de Execução Penal"
ADD COLUMN IF NOT EXISTS ordem integer;

-- Atualizar a ordem dos registros conforme a estrutura correta da lei
-- Cabeçalho e estruturas sem artigos
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 1 WHERE id = 1; -- Cabeçalho

-- TÍTULO I
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 2 WHERE id = 2; -- TÍTULO I
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 3 WHERE "Número do Artigo" = '1º';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 4 WHERE "Número do Artigo" = '2º';

-- TÍTULO II
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 5 WHERE id = 3; -- TÍTULO II
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 6 WHERE id = 4; -- CAPÍTULO I - Da Classificação
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 7 WHERE "Número do Artigo" = '3º';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 8 WHERE "Número do Artigo" = '4º';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 9 WHERE "Número do Artigo" = '5º';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 10 WHERE "Número do Artigo" = '6º';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 11 WHERE "Número do Artigo" = '7º';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 12 WHERE "Número do Artigo" = '8º';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 13 WHERE "Número do Artigo" = '9º';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 14 WHERE "Número do Artigo" = '9º-A';

-- CAPÍTULO II - Da Assistência
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 15 WHERE id = 5; -- CAPÍTULO II
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 16 WHERE id = 6; -- Seção I - Disposições Gerais
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 17 WHERE "Número do Artigo" = '10';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 18 WHERE "Número do Artigo" = '11';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 19 WHERE id = 7; -- Seção II - Da Assistência Material
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 20 WHERE "Número do Artigo" = '12';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 21 WHERE "Número do Artigo" = '13';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 22 WHERE id = 8; -- Seção III - Da Assistência à Saúde
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 23 WHERE "Número do Artigo" = '14';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 24 WHERE id = 9; -- Seção IV - Da Assistência Jurídica
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 25 WHERE "Número do Artigo" = '15';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 26 WHERE "Número do Artigo" = '16';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 27 WHERE id = 10; -- Seção V - Da Assistência Educacional
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 28 WHERE "Número do Artigo" = '17';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 29 WHERE "Número do Artigo" = '18';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 30 WHERE "Número do Artigo" = '18-A';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 31 WHERE "Número do Artigo" = '19';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 32 WHERE "Número do Artigo" = '20';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 33 WHERE "Número do Artigo" = '21';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 34 WHERE "Número do Artigo" = '21-A';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 35 WHERE id = 11; -- Seção VI - Da Assistência Social
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 36 WHERE "Número do Artigo" = '22';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 37 WHERE "Número do Artigo" = '23';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 38 WHERE id = 12; -- Seção VII - Da Assistência Religiosa
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 39 WHERE "Número do Artigo" = '24';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 40 WHERE id = 13; -- Seção VIII - Da Assistência ao Egresso
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 41 WHERE "Número do Artigo" = '25';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 42 WHERE "Número do Artigo" = '26';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 43 WHERE "Número do Artigo" = '27';

-- CAPÍTULO III - Do Trabalho
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 44 WHERE id = 14; -- CAPÍTULO III
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 45 WHERE id = 15; -- Seção I - Disposições Gerais
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 46 WHERE "Número do Artigo" = '28';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 47 WHERE "Número do Artigo" = '29';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 48 WHERE "Número do Artigo" = '30';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 49 WHERE "Número do Artigo" = '31';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 50 WHERE "Número do Artigo" = '32';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 51 WHERE id = 16; -- Seção II - Do Trabalho Interno
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 52 WHERE "Número do Artigo" = '33';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 53 WHERE "Número do Artigo" = '34';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 54 WHERE "Número do Artigo" = '35';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 55 WHERE id = 17; -- Seção III - Do Trabalho Externo
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 56 WHERE "Número do Artigo" = '36';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 57 WHERE "Número do Artigo" = '37';

-- CAPÍTULO IV - Dos Deveres, dos Direitos e da Disciplina
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 58 WHERE id = 18; -- CAPÍTULO IV
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 59 WHERE id = 19; -- Seção I - Dos Deveres
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 60 WHERE "Número do Artigo" = '38';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 61 WHERE "Número do Artigo" = '39';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 62 WHERE id = 20; -- Seção II - Dos Direitos
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 63 WHERE "Número do Artigo" = '40';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 64 WHERE "Número do Artigo" = '41';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 65 WHERE id = 21; -- Seção III - Da Disciplina
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 66 WHERE id = 22; -- Subseção I - Disposições Gerais
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 67 WHERE "Número do Artigo" = '42';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 68 WHERE "Número do Artigo" = '43';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 69 WHERE "Número do Artigo" = '44';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 70 WHERE "Número do Artigo" = '45';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 71 WHERE id = 23; -- Subseção II - Das Faltas Disciplinares
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 72 WHERE "Número do Artigo" = '46';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 73 WHERE "Número do Artigo" = '47';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 74 WHERE "Número do Artigo" = '48';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 75 WHERE "Número do Artigo" = '49';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 76 WHERE "Número do Artigo" = '50';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 77 WHERE "Número do Artigo" = '51';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 78 WHERE "Número do Artigo" = '52';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 79 WHERE id = 24; -- Subseção III - Das Sanções e das Recompensas
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 80 WHERE "Número do Artigo" = '53';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 81 WHERE "Número do Artigo" = '54';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 82 WHERE "Número do Artigo" = '55';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 83 WHERE "Número do Artigo" = '56';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 84 WHERE id = 25; -- Subseção IV - Da Aplicação das Sanções
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 85 WHERE "Número do Artigo" = '57';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 86 WHERE "Número do Artigo" = '58';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 87 WHERE "Número do Artigo" = '59';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 88 WHERE "Número do Artigo" = '60';
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 89 WHERE id = 26; -- Subseção V - Do Procedimento Disciplinar
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET ordem = 90 WHERE "Número do Artigo" = '59-A';

-- Continuar para todos os artigos restantes usando ordem sequencial
-- Para economizar espaço, vou criar uma query que atribui automaticamente para artigos não mapeados
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal"
SET ordem = 1000 + CAST(
  CASE 
    WHEN "Número do Artigo" ~ '^[0-9]+$' THEN "Número do Artigo"
    WHEN "Número do Artigo" ~ '^[0-9]+-' THEN SPLIT_PART("Número do Artigo", '-', 1)
    ELSE '999'
  END AS INTEGER
)
WHERE ordem IS NULL AND "Número do Artigo" IS NOT NULL;

-- Para títulos, capítulos e seções sem ordem ainda
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal"
SET ordem = 2000 + id
WHERE ordem IS NULL;