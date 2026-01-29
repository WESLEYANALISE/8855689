-- Clear all narrations from Vade Mecum tables to regenerate with new format (title + article)

UPDATE "CC - Código Civil" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "ESTATUTO - CIDADE" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "Lei 13.869 de 2019 - Abuso de Autoridade" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "ESTATUTO - ECA" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "CBA Código Brasileiro de Aeronáutica" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "CP - Código Penal" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "CE – Código Eleitoral" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "ESTATUTO - DESARMAMENTO" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;
UPDATE "CF - Constituição Federal" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;