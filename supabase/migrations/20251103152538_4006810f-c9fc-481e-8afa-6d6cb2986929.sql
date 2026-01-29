-- Correção completa da estrutura do CPM (Código Penal Militar)
-- Inclui: cabeçalho, estrutura hierárquica completa e todos os artigos com prefixo "Art. X -"

-- Limpar tabela existente
DELETE FROM "CPM – Código Penal Militar";

-- Resetar sequência do ID
ALTER SEQUENCE "CPM – Código Penal Militar_id_seq" RESTART WITH 1;

-- Cabeçalho da Lei
INSERT INTO "CPM – Código Penal Militar" ("Número do Artigo", "Artigo") VALUES
(NULL, 'DECRETO-LEI Nº 1.001, DE 21 DE OUTUBRO DE 1969

Código Penal Militar

Os Ministros da Marinha de Guerra, do Exército e da Aeronáutica Militar, usando das atribuições que lhes confere o art. 3º do Ato Institucional nº 16, de 14 de outubro de 1969, combinado com o § 1° do art. 2°, do Ato Institucional n° 5, de 13 de dezembro de 1968, decretam:');

-- PARTE GERAL
INSERT INTO "CPM – Código Penal Militar" ("Número do Artigo", "Artigo") VALUES
(NULL, 'PARTE GERAL'),
(NULL, 'LIVRO ÚNICO'),
(NULL, 'TÍTULO I

DA APLICAÇÃO DA LEI PENAL MILITAR');

-- Artigos do Título I (Arts. 1 a 28)
INSERT INTO "CPM – Código Penal Militar" ("Número do Artigo", "Artigo") VALUES
('1', 'Art. 1º - Não há crime sem lei anterior que o defina, nem pena sem prévia cominação legal.'),
('2', 'Art. 2º - Ninguém pode ser punido por fato que lei posterior deixa de considerar crime, cessando em virtude dela a execução e os efeitos penais da sentença condenatória.

§ 1º A lei posterior que, de qualquer outro modo, favorece o agente, aplica-se retroativamente, ainda quando já tenha sobrevindo sentença condenatória irrecorrível.

§ 2º Para se reconhecer qual a mais favorável, a lei posterior e a anterior devem ser consideradas separadamente, cada qual no conjunto de suas normas aplicáveis ao fato.'),
('3', 'Art. 3º - As medidas de segurança regem-se pela lei vigente ao tempo da sentença, prevalecendo, entretanto, se diversa, a lei vigente ao tempo da execução.'),
('4', 'Art. 4º - A lei excepcional ou temporária, embora decorrido o período de sua duração ou cessadas as circunstâncias que a determinaram, aplica-se ao fato praticado durante sua vigência.'),
('5', 'Art. 5º - Considera-se praticado o crime no momento da ação ou omissão, ainda que outro seja o do resultado.'),
('6', 'Art. 6º - Considera-se praticado o fato, no lugar em que se desenvolveu a atividade criminosa, no todo ou em parte, e ainda que sob forma de participação, bem como onde se produziu ou deveria produzir-se o resultado. Nos crimes omissivos, o fato considera-se praticado no lugar em que deveria realizar-se a ação omitida.'),
('7', 'Art. 7º - Aplica-se a lei penal militar, sem prejuízo de convenções, tratados e regras de direito internacional, ao crime cometido, no todo ou em parte no território nacional, ou fora dele, ainda que, neste caso, o agente esteja sendo processado ou tenha sido julgado pela justiça estrangeira.

§ 1º Para os efeitos da lei penal militar consideram-se como extensão do território nacional as aeronaves e os navios brasileiros, onde quer que se encontrem, sob comando militar ou militarmente utilizados ou ocupados por ordem legal de autoridade competente, ainda que de propriedade privada.

§ 2º É também aplicável a lei penal militar ao crime praticado a bordo de aeronaves ou navios estrangeiros, desde que em lugar sujeito à administração militar, e o crime atente contra as instituições militares.

§ 3º Para efeito da aplicação deste Código, considera-se navio toda embarcação sob comando militar.'),
('8', 'Art. 8º - A pena cumprida no estrangeiro atenua a pena imposta no Brasil pelo mesmo crime, quando diversas, ou nela é computada, quando idênticas.');