-- Limpar todas as narrações do Vade Mecum para regenerar com novo formato

-- Códigos principais
UPDATE "CC - Código Civil" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "CP - Código Penal" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "CF - Constituição Federal" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "CPC – Código de Processo Civil" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "CPP – Código de Processo Penal" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "CLT - Consolidação das Leis do Trabalho" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "CDC – Código de Defesa do Consumidor" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "CTN – Código Tributário Nacional" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "CTB Código de Trânsito Brasileiro" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "CE – Código Eleitoral" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "CA - Código de Águas" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "CBA Código Brasileiro de Aeronáutica" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "CBT Código Brasileiro de Telecomunicações" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "CCOM – Código Comercial" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "CDM – Código de Minas" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "CPM – Código Penal Militar" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "CPPM – Código de Processo Penal Militar" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;

-- Leis específicas
UPDATE "LEI 8213 - Benefícios" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "LEI 8212 - Custeio" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "LEI 8429 - IMPROBIDADE" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "LEI 12527 - ACESSO INFORMACAO" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "LEI 12846 - ANTICORRUPCAO" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "LEI 13140 - MEDIACAO" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "LEI 13709 - LGPD" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "LC 101 - LRF" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "LEI 14133 - LICITACOES" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "LEI 4717 - ACAO POPULAR" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "LEI 6015 - REGISTROS PUBLICOS" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "LEI 7347 - ACAO CIVIL PUBLICA" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "LEI 9099 - JUIZADOS CIVEIS" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "LEI 9430 - LEGISLACAO TRIBUTARIA" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "LEI 9784 - PROCESSO ADMINISTRATIVO" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "LEI 9868 - ADI E ADC" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;