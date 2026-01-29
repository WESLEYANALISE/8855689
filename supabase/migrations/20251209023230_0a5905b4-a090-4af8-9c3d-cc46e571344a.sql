-- Limpar narrações do Estatuto da OAB
UPDATE "ESTATUTO - OAB" SET "Narração" = NULL WHERE "Narração" IS NOT NULL;