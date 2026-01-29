-- FASE 1: CPM Artigos 1-100 com títulos
DELETE FROM "CPM – Código Penal Militar";
ALTER SEQUENCE "CPM – Código Penal Militar_id_seq" RESTART WITH 1;

INSERT INTO "CPM – Código Penal Militar" ("Número do Artigo", "Artigo") VALUES
(NULL, 'DECRETO-LEI Nº 1.001, DE 21 DE OUTUBRO DE 1969 - Código Penal Militar'),
(NULL, 'CÓDIGO PENAL MILITAR'),
(NULL, 'PARTE GERAL'),
(NULL, 'LIVRO ÚNICO'),
(NULL, 'TÍTULO I - DA APLICAÇÃO DA LEI PENAL MILITAR'),
('1', 'Princípio de legalidade

Art. 1º - Não há crime sem lei anterior que o defina, nem pena sem prévia cominação legal.'),
('2', 'Lei supressiva de incriminação

Art. 2º - Ninguém pode ser punido por fato que lei posterior deixa de considerar crime, cessando em virtude dela a execução e os efeitos penais da sentença condenatória.

Retroatividade de lei mais benigna

§ 1º A lei posterior que, de qualquer outro modo, favorece o agente, aplica-se retroativamente, ainda quando já tenha sobrevindo sentença condenatória irrecorrível.

Apuração da maior benignidade

§ 2º Para se reconhecer qual a mais favorável, a lei posterior e a anterior devem ser consideradas separadamente, cada qual no conjunto de suas normas aplicáveis ao fato.'),
('3', 'Medidas de segurança

Art. 3º - As medidas de segurança regem-se pela lei vigente ao tempo da sentença, prevalecendo, entretanto, se diversa, a lei vigente ao tempo da execução.'),
('4', 'Lei excepcional ou temporária

Art. 4º - A lei excepcional ou temporária, embora decorrido o período de sua duração ou cessadas as circunstâncias que a determinaram, aplica-se ao fato praticado durante sua vigência.'),
('5', 'Tempo do crime

Art. 5º - Considera-se praticado o crime no momento da ação ou omissão, ainda que outro seja o do resultado.');