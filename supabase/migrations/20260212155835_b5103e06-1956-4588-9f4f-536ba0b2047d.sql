-- Fix missing article numbers in ESTATUTO - OAB
UPDATE "ESTATUTO - OAB" SET "Número do Artigo" = '1º' WHERE id = 5;

-- Check if Art. 6º and 8º exist, they seem to be missing rows
-- Art. 6º content should be in a record - let's check what's between 5º (id=9) and 7º (id=11)
-- id=10 is "CAPÍTULO II" header, so Art. 6º is missing entirely
-- We need to check for Art. 8º too - between 7º (id=11) and 9º (id=13), id=12 is "CAPÍTULO III"
-- These articles may need to be inserted

-- First update the known missing number
-- Art 6º and 8º are genuinely missing from the data, we'll insert them

INSERT INTO "ESTATUTO - OAB" (id, "Número do Artigo", "Artigo") VALUES 
(1006, '6º', 'Art. 6º Não há hierarquia nem subordinação entre advogados, magistrados e membros do Ministério Público, devendo todos tratar-se com consideração e respeito recíprocos.

Parágrafo único. As autoridades, os servidores públicos e os serventuários da justiça devem dispensar ao advogado, no exercício da profissão, tratamento compatível com a dignidade da advocacia e condições adequadas a seu desempenho.'),
(1008, '8º', 'Art. 8º Para inscrição como advogado é necessário:

I - capacidade civil;

II - diploma ou certidão de graduação em Direito, obtido em instituição de ensino oficialmente autorizada e credenciada;

III - título de eleitor e quitação do serviço militar, se brasileiro;

IV - aprovação em Exame de Ordem;

V - não exercer atividade incompatível com a advocacia;

VI - idoneidade moral;

VII - prestar compromisso perante o conselho.

§ 1º O Exame de Ordem é regulamentado em provimento do Conselho Federal da OAB.

§ 2º O estrangeiro ou brasileiro, quando não graduado em Direito no Brasil, deve fazer prova do título de graduação, obtido em instituição estrangeira, devidamente revalidado, além de atender aos demais requisitos previstos neste artigo.');
