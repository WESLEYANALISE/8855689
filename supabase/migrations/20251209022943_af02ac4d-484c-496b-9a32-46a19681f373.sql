-- Limpar todas as narrações do Vade Mecum

-- Códigos Principais
UPDATE "CF - Constituição Federal" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "CC - Código Civil" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "CP - Código Penal" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "CPC – Código de Processo Civil" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "CPP – Código de Processo Penal" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "CLT - Consolidação das Leis do Trabalho" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "CTN – Código Tributário Nacional" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "CDC – Código de Defesa do Consumidor" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "CE – Código Eleitoral" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "CTB Código de Trânsito Brasileiro" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;

-- Códigos Militares e Especiais
UPDATE "CPM – Código Penal Militar" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "CPPM – Código de Processo Penal Militar" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "CBA Código Brasileiro de Aeronáutica" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "CBT Código Brasileiro de Telecomunicações" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "CCOM – Código Comercial" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "CDM – Código de Minas" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "CA - Código de Águas" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;

-- Estatutos
UPDATE "ESTATUTO - ECA" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "ESTATUTO - IDOSO" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "ESTATUTO - PESSOA COM DEFICIÊNCIA" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "ESTATUTO - OAB" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "ESTATUTO - DESARMAMENTO" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "ESTATUTO - TORCEDOR" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "ESTATUTO - IGUALDADE RACIAL" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "ESTATUTO - CIDADE" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;

-- Legislação Penal Especial
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "Lei 11.340 de 2006 - Maria da Penha" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "Lei 11.343 de 2006 - Lei de Drogas" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "Lei 9.455 de 1997 - Tortura" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "Lei 9.099 de 1995 - Juizados Especiais" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "Lei 12.850 de 2013 - Organizações Criminosas" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "Lei 13.964 de 2019 - Pacote Anticrime" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "Lei 13.869 de 2019 - Abuso de Autoridade" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "Lei 9.296 de 1996 - Interceptação Telefônica" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "Lei 8.072 de 1990 - Crimes Hediondos" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "Lei 14.197 de 2021 - Crimes Contra o Estado Democrático" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "LLD - Lei de Lavagem de Dinheiro" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;

-- Leis Previdenciárias e Trabalhistas
UPDATE "LEI 8213 - Benefícios" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "LEI 8212 - Custeio" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;

-- Leis Ordinárias
UPDATE "LEI 9099 - JUIZADOS CIVEIS" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "LEI 14133 - LICITACOES" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "LEI 8429 - IMPROBIDADE" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "LEI 7347 - ACAO CIVIL PUBLICA" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "LEI 13140 - MEDIACAO" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "LEI 6015 - REGISTROS PUBLICOS" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "LEI 9784 - PROCESSO ADMINISTRATIVO" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "LEI 12527 - ACESSO INFORMACAO" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "LEI 4717 - ACAO POPULAR" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "LEI 9868 - ADI E ADC" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "LEI 13709 - LGPD" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "LEI 12846 - ANTICORRUPCAO" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "LEI 9430 - LEGISLACAO TRIBUTARIA" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "LC 101 - LRF" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;

-- Súmulas
UPDATE "SUMULAS STF" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "SUMULAS STJ" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "SUMULAS TST" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "SUMULAS TSE" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "SUMULAS STM" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "SUMULAS TCU" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "SUMULAS VINCULANTES" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "ENUNCIADOS CNJ" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "ENUNCIADOS CNMP" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;