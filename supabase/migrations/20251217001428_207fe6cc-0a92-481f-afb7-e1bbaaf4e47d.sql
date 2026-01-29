-- Deletar artigos duplicados com ponto no final do número (formatos como "85.")
DELETE FROM "CC - Código Civil" WHERE "Número do Artigo" ~ '^[0-9]+\.$';
DELETE FROM "CPC – Código de Processo Civil" WHERE "Número do Artigo" ~ '^[0-9]+\.$';
DELETE FROM "CP - Código Penal" WHERE "Número do Artigo" ~ '^[0-9]+\.$';
DELETE FROM "CPP – Código de Processo Penal" WHERE "Número do Artigo" ~ '^[0-9]+\.$';
DELETE FROM "CF - Constituição Federal" WHERE "Número do Artigo" ~ '^[0-9]+\.$';
DELETE FROM "CLT - Consolidação das Leis do Trabalho" WHERE "Número do Artigo" ~ '^[0-9]+\.$';
DELETE FROM "CDC – Código de Defesa do Consumidor" WHERE "Número do Artigo" ~ '^[0-9]+\.$';
DELETE FROM "CE – Código Eleitoral" WHERE "Número do Artigo" ~ '^[0-9]+\.$';
DELETE FROM "CPM – Código Penal Militar" WHERE "Número do Artigo" ~ '^[0-9]+\.$';
DELETE FROM "CF - Código Florestal" WHERE "Número do Artigo" ~ '^[0-9]+\.$';
DELETE FROM "CA - Código de Águas" WHERE "Número do Artigo" ~ '^[0-9]+\.$';
DELETE FROM "CTN – Código Tributário Nacional" WHERE "Número do Artigo" ~ '^[0-9]+\.$';
DELETE FROM "CPI - Código de Propriedade Industrial" WHERE "Número do Artigo" ~ '^[0-9]+\.$';
DELETE FROM "CTB Código de Trânsito Brasileiro" WHERE "Número do Artigo" ~ '^[0-9]+\.$';
DELETE FROM "Lei 7.210 de 1984 - Lei de Execução Penal" WHERE "Número do Artigo" ~ '^[0-9]+\.$';
DELETE FROM "Lei 8.072 de 1990 - Crimes Hediondos" WHERE "Número do Artigo" ~ '^[0-9]+\.$';
DELETE FROM "Lei 11.340 de 2006 - Maria da Penha" WHERE "Número do Artigo" ~ '^[0-9]+\.$';
DELETE FROM "Lei 11.343 de 2006 - Lei de Drogas" WHERE "Número do Artigo" ~ '^[0-9]+\.$';