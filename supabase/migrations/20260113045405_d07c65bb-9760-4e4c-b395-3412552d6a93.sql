-- Limpar todos os dados da tabela de leitura dinâmica
TRUNCATE TABLE "BIBLIOTECA-LEITURA-DINAMICA";

-- Resetar a sequência do ID
ALTER SEQUENCE "BIBLIOTECA-LEITURA-DINAMICA_id_seq" RESTART WITH 1;