-- FASE 1: Popular CPM com artigos 1 a 100
-- Limpar tabela existente
DELETE FROM "CPM – Código Penal Militar";

-- Inserir cabeçalho e estrutura inicial
INSERT INTO "CPM – Código Penal Militar" ("Número do Artigo", "Artigo", "Aula") VALUES
(NULL, 'DECRETO-LEI Nº 1.001, DE 21 DE OUTUBRO DE 1969', 'Código Penal Militar'),
(NULL, 'CÓDIGO PENAL MILITAR', NULL),
(NULL, 'PARTE GERAL', NULL),
(NULL, 'LIVRO ÚNICO', NULL),
(NULL, 'TÍTULO I', NULL),
(NULL, 'DA APLICAÇÃO DA LEI PENAL MILITAR', NULL);

-- Artigos 1 a 9 (TÍTULO I)
INSERT INTO "CPM – Código Penal Militar" ("Número do Artigo", "Artigo", "Aula") VALUES
('1', 'Art. 1º - Não há crime sem lei anterior que o defina, nem pena sem prévia cominação legal.', 'Princípio de legalidade'),
('2', 'Art. 2º - Ninguém pode ser punido por fato que lei posterior deixa de considerar crime, cessando em virtude dela a execução e os efeitos penais da sentença condenatória.

§ 1º A lei posterior que, de qualquer outro modo, favorece o agente, aplica-se retroativamente, ainda quando já tenha sobrevindo sentença condenatória irrecorrível.

§ 2º Para se reconhecer qual a mais favorável, a lei posterior e a anterior devem ser consideradas separadamente, cada qual no conjunto de suas normas aplicáveis ao fato.', 'Lei supressiva de incriminação'),
('3', 'Art. 3º - As medidas de segurança regem-se pela lei vigente ao tempo da sentença, prevalecendo, entretanto, se diversa, a lei vigente ao tempo da execução.', 'Medidas de segurança'),
('4', 'Art. 4º - A lei excepcional ou temporária, embora decorrido o período de sua duração ou cessadas as circunstâncias que a determinaram, aplica-se ao fato praticado durante sua vigência.', 'Lei excepcional ou temporária'),
('5', 'Art. 5º - Considera-se praticado o crime no momento da ação ou omissão, ainda que outro seja o do resultado.', 'Tempo do crime'),
('6', 'Art. 6º - Considera-se praticado o fato, no lugar em que se desenvolveu a atividade criminosa, no todo ou em parte, e ainda que sob forma de participação, bem como onde se produziu ou deveria produzir-se o resultado. Nos crimes omissivos, o fato considera-se praticado no lugar em que deveria realizar-se a ação omitida.', 'Lugar do crime'),
('7', 'Art. 7º - Aplica-se a lei penal militar, sem prejuízo de convenções, tratados e regras de direito internacional, ao crime cometido, no todo ou em parte no território nacional, ou fora dele, ainda que, neste caso, o agente esteja sendo processado ou tenha sido julgado pela justiça estrangeira.

§ 1º Para os efeitos da lei penal militar consideram-se como extensão do território nacional as aeronaves e os navios brasileiros, onde quer que se encontrem, sob comando militar ou militarmente utilizados ou ocupados por ordem legal de autoridade competente, ainda que de propriedade privada.

§ 2º É também aplicável a lei penal militar ao crime praticado a bordo de aeronaves ou navios estrangeiros, desde que em lugar sujeito à administração militar, e o crime atente contra as instituições militares.

§ 3º Para efeito da aplicação deste Código, considera-se navio tôda embarcação sob comando militar.', 'Territorialidade, Extraterritorialidade'),
('8', 'Art. 8º - A pena cumprida no estrangeiro atenua a pena imposta no Brasil pelo mesmo crime, quando diversas, ou nela é computada, quando idênticas.', 'Pena cumprida no estrangeiro'),
('9', 'Art. 9º - Consideram-se crimes militares, em tempo de paz:

I - os crimes de que trata este Código, quando definidos de modo diverso na lei penal comum, ou nela não previstos, qualquer que seja o agente, salvo disposição especial;

II - os crimes previstos neste Código e os previstos na legislação penal, quando praticados:

a) por militar da ativa contra militar na mesma situação;

b) por militar da ativa, em lugar sujeito à administração militar, contra militar da reserva ou reformado ou contra civil;

c) por militar em serviço ou atuando em razão da função, em comissão de natureza militar, ou em formatura, ainda que fora do lugar sujeito à administração militar contra militar da reserva, ou reformado, ou civil;

d) por militar, durante o período de manobras ou exercício, contra militar da reserva ou reformado ou contra civil;

e) por militar da ativa contra o patrimônio sob a administração militar ou contra a ordem administrativa militar;

III - Crimes praticados por militar da reserva, ou reformado, ou por civil:

a) contra o patrimônio sob a administração militar, ou contra a ordem administrativa militar;

b) em lugar sujeito à administração militar, contra militar da ativa ou contra servidor público das instituições militares ou da Justiça Militar, no exercício de função inerente ao seu cargo;

c) contra militar em formatura, ou durante o período de prontidão, vigilância, observação, exploração, exercício, acampamento, acantonamento ou manobras;

d) ainda que fora do lugar sujeito à administração militar, contra militar em função de natureza militar, ou no desempenho de serviço de vigilância, garantia e preservação da ordem pública, administrativa ou judiciária, quando legalmente requisitado para aquele fim, ou em obediência a determinação legal superior.', 'Crimes militares em tempo de paz');

-- Artigos 10 a 28 (TÍTULO I - continuação)
INSERT INTO "CPM – Código Penal Militar" ("Número do Artigo", "Artigo", "Aula") VALUES
('10', 'Art. 10 - Consideram-se crimes militares, em tempo de guerra:

I - os especialmente previstos neste Código para o tempo de guerra;

II - os crimes militares previstos para o tempo de paz;

III - os crimes previstos neste Código, embora também o sejam com igual definição na lei penal comum ou especial, quando praticados, qualquer que seja o agente:

a) em território nacional, ou estrangeiro, militarmente ocupado;

b) em qualquer lugar, se comprometem ou podem comprometer a preparação, a eficiência ou as operações militares ou, de qualquer outra forma, atentam contra a segurança externa do País ou podem expô-la a perigo;

IV - os crimes definidos na lei penal comum ou especial, embora não previstos neste Código, quando praticados em zona de efetivas operações militares ou em território estrangeiro, militarmente ocupado.', 'Crimes militares em tempo de guerra'),
('11', 'Art. 11 - Os militares estrangeiros, quando em comissão ou em estágio em instituições militares, ficam sujeitos à lei penal militar brasileira, ressalvado o disposto em tratados ou em convenções internacionais.', 'Militares estrangeiros'),
('12', 'Art. 12 - O militar da reserva ou reformado, quando empregado na administração militar, equipara-se ao militar da ativa, para o efeito da aplicação da lei penal militar.', 'Equiparação a militar da ativa'),
('13', 'Art. 13 - O militar da reserva, ou reformado, conserva as responsabilidades e prerrogativas do posto ou graduação, para o efeito da aplicação da lei penal militar, quando pratica ou contra ele é praticado crime militar.', 'Militar da reserva ou reformado'),
('14', 'Art. 14 - O defeito do ato de incorporação ou de matrícula não exclui a aplicação da lei penal militar, salvo se alegado ou conhecido antes da prática do crime.', 'Defeito de incorporação ou de matrícula'),
('15', 'Art. 15 - O tempo de guerra, para os efeitos da aplicação da lei penal militar, começa com a declaração ou o reconhecimento do estado de guerra, ou com o decreto de mobilização se nele estiver compreendido aquele reconhecimento; e termina quando ordenada a cessação das hostilidades.', 'Tempo de guerra'),
('16', 'Art. 16 - No cômputo dos prazos inclui-se o dia do começo. Contam-se os dias, os meses e os anos pelo calendário comum.', 'Contagem de prazo'),
('17', 'Art. 17 - As regras gerais deste Código aplicam-se aos fatos incriminados por lei penal militar especial, se esta não dispõe de modo diverso. Para os efeitos penais, salário mínimo é o maior mensal vigente no país, ao tempo da sentença.', 'Legislação especial. Salário-mínimo'),
('18', 'Art. 18 - Ficam sujeitos às disposições deste Código os crimes praticados em prejuízo de país em guerra contra país inimigo do Brasil:

I - se o crime é praticado por brasileiro;

II - se o crime é praticado no território nacional, ou em território estrangeiro, militarmente ocupado por força brasileira, qualquer que seja o agente.', 'Crimes praticados em prejuízo de país aliado'),
('19', 'Art. 19 - Este Código não compreende as infrações dos regulamentos disciplinares.', 'Infrações disciplinares'),
('20', 'Art. 20 - Aos crimes praticados em tempo de guerra, salvo disposição especial, aplicam-se as penas cominadas para o tempo de paz, com o aumento de um terço.', 'Crimes praticados em tempo de guerra'),
('22', 'Art. 22 - É militar, para o efeito da aplicação deste Código, qualquer pessoa que, em tempo de paz ou de guerra, seja incorporada a instituições militares ou nelas matriculada, para servir em posto ou em graduação ou em regime de sujeição à disciplina militar.', 'Pessoa considerada militar'),
('23', 'Art. 23 - Equipara-se ao comandante, para o efeito da aplicação da lei penal militar, toda autoridade com função de direção.', 'Equiparação a comandante'),
('24', 'Art. 24 - Considera-se superior para fins de aplicação da lei penal militar:

I - o militar que ocupa nível hierárquico, posto ou graduação superiores, conforme a antiguidade, nos termos da Lei nº 6.880, de 9 de dezembro de 1980 (Estatuto dos Militares), e de leis das unidades da Federação que regulam o regime jurídico de seus militares;

II - o militar que, em virtude da função, exerce autoridade sobre outro de igual posto ou graduação.

Parágrafo único. O militar sobre o qual se exerce autoridade nas condições descritas nos incisos I e II do caput deste artigo é considerado inferior hierárquico para fins de aplicação da lei penal militar.', 'Conceito de superior'),
('25', 'Art. 25 - Diz-se crime praticado em presença do inimigo, quando o fato ocorre em zona de efetivas operações militares, ou na iminência ou em situação de hostilidade.', 'Crime praticado em presença do inimigo'),
('26', 'Art. 26 - Quando a lei penal militar se refere a "brasileiro" ou "nacional", compreende as pessoas enumeradas como brasileiros na Constituição do Brasil.

Parágrafo único. Para os efeitos da lei penal militar, são considerados estrangeiros os apátridas e os brasileiros que perderam a nacionalidade.', 'Referência a "brasileiro" ou "nacional"'),
('27', 'Art. 27 - Para o efeito da aplicação deste Código, consideram-se servidores da Justiça Militar os juízes, os servidores públicos e os auxiliares da Justiça Militar.', 'Servidores da Justiça Militar'),
('28', 'Art. 28 - Os crimes contra a segurança externa do país ou contra as instituições militares, definidos neste Código, excluem os da mesma natureza definidos em outras leis.', 'Casos de prevalência do Código Penal Militar');

-- TÍTULO II
INSERT INTO "CPM – Código Penal Militar" ("Número do Artigo", "Artigo", "Aula") VALUES
(NULL, 'TÍTULO II', NULL),
(NULL, 'DO CRIME', NULL);

-- Artigos 29 a 47 (TÍTULO II)
INSERT INTO "CPM – Código Penal Militar" ("Número do Artigo", "Artigo", "Aula") VALUES
('29', 'Art. 29 - O resultado de que depende a existência do crime somente é imputável a quem lhe deu causa. Considera-se causa a ação ou omissão sem a qual o resultado não teria ocorrido.

§ 1º A superveniência de causa relativamente independente exclui a imputação quando, por si só, produziu o resultado. Os fatos anteriores, imputam-se, entretanto, a quem os praticou.

§ 2º A omissão é relevante como causa quando o omitente devia e podia agir para evitar o resultado. O dever de agir incumbe a quem tenha por lei obrigação de cuidado, proteção ou vigilância; a quem, de outra forma, assumiu a responsabilidade de impedir o resultado; e a quem, com seu comportamento anterior, criou o risco de sua superveniência.', 'Relação de causalidade'),
('30', 'Art. 30 - Diz-se o crime:

I - consumado, quando nele se reúnem todos os elementos de sua definição legal;

II - tentado, quando, iniciada a execução, não se consuma por circunstâncias alheias à vontade do agente.

Parágrafo único. Pune-se a tentativa com a pena correspondente ao crime, diminuída de um a dois terços, podendo o juiz, no caso de excepcional gravidade, aplicar a pena do crime consumado.', 'Crime consumado / Tentativa'),
('31', 'Art. 31 - O agente que, voluntariamente, desiste de prosseguir na execução ou impede que o resultado se produza, só responde pelos atos já praticados.', 'Desistência voluntária e arrependimento eficaz'),
('32', 'Art. 32 - Quando, por ineficácia absoluta do meio empregado ou por absoluta impropriedade do objeto, é impossível consumar-se o crime, nenhuma pena é aplicável.', 'Crime impossível'),
('33', 'Art. 33 - Diz-se o crime:

I - doloso, quando o agente quis o resultado ou assumiu o risco de produzi-lo;

II - culposo, quando o agente, deixando de empregar a cautela, atenção, ou diligência ordinária, ou especial, a que estava obrigado em face das circunstâncias, não prevê o resultado que podia prever ou, prevendo-o, supõe levianamente que não se realizaria ou que poderia evitá-lo.

Parágrafo único. Salvo os casos expressos em lei, ninguém pode ser punido por fato previsto como crime, senão quando o pratica dolosamente.', 'Culpabilidade'),
('34', 'Art. 34 - Pelos resultados que agravam especialmente as penas só responde o agente quando os houver causado, pelo menos, culposamente.', 'Nenhuma pena sem culpabilidade'),
('35', 'Art. 35 - A pena pode ser atenuada ou substituída por outra menos grave quando o agente, salvo em se tratando de crime que atente contra o dever militar, supõe lícito o fato, por ignorância ou erro de interpretação da lei, se escusáveis.', 'Erro de direito'),
('36', 'Art. 36 - É isento de pena quem, ao praticar o crime, supõe, por erro plenamente escusável, a inexistência de circunstância de fato que o constitui ou a existência de situação de fato que tornaria a ação legítima.

§ 1º Se o erro deriva de culpa, a este título responde o agente, se o fato é punível como crime culposo.

§ 2º Se o erro é provocado por terceiro, responderá este pelo crime, a título de dolo ou culpa, conforme o caso.', 'Erro de fato'),
('37', 'Art. 37 - Quando o agente, por erro de percepção ou no uso dos meios de execução, ou outro acidente, atinge uma pessoa em vez de outra, responde como se tivesse praticado o crime contra aquela que realmente pretendia atingir. Devem ter-se em conta não as condições e qualidades da vítima, mas as da outra pessoa, para configuração, qualificação ou exclusão do crime, e agravação ou atenuação da pena.

§ 1º Se, por erro ou outro acidente na execução, é atingido bem jurídico diverso do visado pelo agente, responde este por culpa, se o fato é previsto como crime culposo.

§ 2º Se, no caso do artigo, é também atingida a pessoa visada, ou, no caso do parágrafo anterior, ocorre ainda o resultado pretendido, aplica-se a regra do art. 79.', 'Erro sobre a pessoa'),
('38', 'Art. 38 - Não é culpado quem comete o crime:

a) sob coação irresistível ou que lhe suprima a faculdade de agir segundo a própria vontade;

b) em estrita obediência a ordem direta de superior hierárquico, em matéria de serviços.

§ 1º Responde pelo crime o autor da coação ou da ordem.

§ 2º Se a ordem do superior tem por objeto a prática de ato manifestamente criminoso, ou há excesso nos atos ou na forma da execução, é punível também o inferior hierárquico.', NULL),
('39', 'Art. 39 - Não é igualmente culpado quem, para proteger direito próprio ou de pessoa a quem está ligado por estreitas relações de parentesco ou afeição, contra perigo certo e atual, que não provocou, nem podia de outro modo evitar, sacrifica direito alheio, ainda quando superior ao direito protegido, desde que não lhe era razoavelmente exigível conduta diversa.', 'Estado de necessidade, com excludente de culpabilidade'),
('40', 'Art. 40 - Nos crimes em que há violação do dever militar, o agente não pode invocar coação irresistível senão quando física ou material.', 'Coação física ou material'),
('41', 'Art. 41 - Nos casos do art. 38, letras a e b, se era possível resistir à coação, ou se a ordem não era manifestamente ilegal; ou, no caso do art. 39, se era razoavelmente exigível o sacrifício do direito ameaçado, o juiz, tendo em vista as condições pessoais do réu, pode atenuar a pena.', 'Atenuação de pena'),
('42', 'Art. 42 - Não há crime quando o agente pratica o fato:

I - em estado de necessidade;

II - em legítima defesa;

III - em estrito cumprimento do dever legal;

IV - em exercício regular de direito.

Parágrafo único. Não há igualmente crime quando o comandante de navio, aeronave ou praça de guerra, na iminência de perigo ou grave calamidade, compele os subalternos, por meios violentos, a executar serviços e manobras urgentes, para salvar a unidade ou vidas, ou evitar o desânimo, o terror, a desordem, a rendição, a revolta ou o saque.', 'Exclusão de crime'),
('43', 'Art. 43 - Considera-se em estado de necessidade quem pratica o fato para preservar direito seu ou alheio, de perigo certo e atual, que não provocou, nem podia de outro modo evitar, desde que o mal causado, por sua natureza e importância, é consideravelmente inferior ao mal evitado, e o agente não era legalmente obrigado a arrostar o perigo.', 'Estado de necessidade, como excludente do crime'),
('44', 'Art. 44 - Entende-se em legítima defesa quem, usando moderadamente dos meios necessários, repele injusta agressão, atual ou iminente, a direito seu ou de outrem.', 'Legítima defesa'),
('45', 'Art. 45 - O agente que, em qualquer dos casos de exclusão de crime, excede culposamente os limites da necessidade, responde pelo fato, se este é punível, a título de culpa.

Parágrafo único. Não é punível o excesso quando resulta de escusável surpresa ou perturbação de ânimo, em face da situação.', 'Excesso culposo'),
('46', 'Art. 46 - O juiz pode atenuar a pena ainda quando punível o fato por excesso doloso.', 'Excesso doloso'),
('47', 'Art. 47 - Deixam de ser elementos constitutivos do crime:

a) a qualidade de superior ou a de inferior hierárquico, quando não conhecida do agente;

b) a qualidade de superior ou a de inferior hierárquico, a de oficial de dia, de serviço ou de quarto, ou a de sentinela, vigia ou plantão, quando a ação é praticada em repulsa a agressão.', 'Elementos não constitutivos do crime');

-- TÍTULO III
INSERT INTO "CPM – Código Penal Militar" ("Número do Artigo", "Artigo", "Aula") VALUES
(NULL, 'TÍTULO III', NULL),
(NULL, 'DA IMPUTABILIDADE PENAL', NULL);

-- Artigos 48 a 52 (TÍTULO III)
INSERT INTO "CPM – Código Penal Militar" ("Número do Artigo", "Artigo", "Aula") VALUES
('48', 'Art. 48 - Não é imputável quem, no momento da ação ou da omissão, não possui a capacidade de entender o caráter ilícito do fato ou de determinar-se de acordo com esse entendimento, em virtude de doença mental, de desenvolvimento mental incompleto ou retardado.

Parágrafo único. Se a doença ou a deficiência mental não suprime, mas diminui consideravelmente a capacidade de entendimento da ilicitude do fato ou a de autodeterminação, não fica excluída a imputabilidade, mas a pena pode ser reduzida de 1/3 (um terço) a 2/3 (dois terços), sem prejuízo do disposto no art. 113 deste Código.', 'Inimputáveis'),
('49', 'Art. 49 - Não é igualmente imputável o agente que, por embriaguez completa proveniente de caso fortuito ou força maior, era, ao tempo da ação ou da omissão, inteiramente incapaz de entender o caráter criminoso do fato ou de determinar-se de acordo com esse entendimento.

Parágrafo único. A pena pode ser reduzida de um a dois terços, se o agente por embriaguez proveniente de caso fortuito ou força maior, não possuía, ao tempo da ação ou da omissão, a plena capacidade de entender o caráter criminoso do fato ou de determinar-se de acordo com esse entendimento.', 'Embriaguez'),
('50', 'Art. 50 - O menor de 18 (dezoito) anos é penalmente inimputável, ficando sujeito às normas estabelecidas na legislação especial.', 'Menores');

-- TÍTULO IV
INSERT INTO "CPM – Código Penal Militar" ("Número do Artigo", "Artigo", "Aula") VALUES
(NULL, 'TÍTULO IV', NULL),
(NULL, 'DO CONCURSO DE AGENTES', NULL);

-- Artigos 53 a 54 (TÍTULO IV)
INSERT INTO "CPM – Código Penal Militar" ("Número do Artigo", "Artigo", "Aula") VALUES
('53', 'Art. 53 - Quem, de qualquer modo, concorre para o crime incide nas penas a este cominadas.

§ 1º A punibilidade de qualquer dos concorrentes é independente da dos outros, determinando-se segundo a sua própria culpabilidade. Não se comunicam, outrossim, as condições ou circunstâncias de caráter pessoal, salvo quando elementares do crime.

§ 2º A pena é agravada em relação ao agente que:

I - promove ou organiza a cooperação no crime ou dirige a atividade dos demais agentes;

II - coage outrem à execução material do crime;

III - instiga ou determina a cometer o crime alguém sujeito à sua autoridade, ou não punível em virtude de condição ou qualidade pessoal;

IV - executa o crime, ou nele participa, mediante paga ou promessa de recompensa.

§ 3º A pena é atenuada com relação ao agente, cuja participação no crime é de somenos importância.

§ 4º Na prática de crime de autoria coletiva necessária, reputam-se cabeças os que dirigem, provocam, instigam ou excitam a ação.

§ 5º Quando o crime é cometido por inferiores hierárquicos e um ou mais oficiais, são estes considerados cabeças, assim como os inferiores hierárquicos que exercem função de oficial.', 'Coautoria'),
('54', 'Art. 54 - O ajuste, a determinação ou instigação e o auxílio, salvo disposição em contrário, não são puníveis se o crime não chega, pelo menos, a ser tentado.', 'Casos de impunibilidade');

-- TÍTULO V
INSERT INTO "CPM – Código Penal Militar" ("Número do Artigo", "Artigo", "Aula") VALUES
(NULL, 'TÍTULO V', NULL),
(NULL, 'DAS PENAS', NULL),
(NULL, 'CAPÍTULO I', NULL),
(NULL, 'DAS PENAS PRINCIPAIS', NULL);

-- Artigos 55 a 68 (TÍTULO V - CAPÍTULO I)
INSERT INTO "CPM – Código Penal Militar" ("Número do Artigo", "Artigo", "Aula") VALUES
('55', 'Art. 55 - As penas principais são:

a) morte;

b) reclusão;

c) detenção;

d) prisão;

e) impedimento.', 'Penas principais'),
('56', 'Art. 56 - A pena de morte é executada por fuzilamento.', 'Pena de morte'),
('57', 'Art. 57 - A sentença definitiva de condenação à morte é comunicada, logo que passe em julgado, ao Presidente da República, e não pode ser executada senão depois de sete dias após a comunicação.

Parágrafo único. Se a pena é imposta em zona de operações de guerra, pode ser imediatamente executada, quando o exigir o interêsse da ordem e da disciplina militares.', 'Comunicação'),
('58', 'Art. 58 - O mínimo da pena de reclusão é de um ano, e o máximo de trinta anos; o mínimo da pena de detenção é de trinta dias, e o máximo de dez anos.', 'Mínimos e máximos genéricos'),
('59', 'Art. 59 - A pena de reclusão ou de detenção até 2 (dois) anos, aplicada a militar, é convertida em pena de prisão e cumprida, quando não cabível a suspensão condicional:

I - pelo oficial, em recinto de estabelecimento militar;

II - pela praça, em estabelecimento penal militar, onde ficará separada de presos que estejam cumprindo pena disciplinar ou pena privativa de liberdade por tempo superior a dois anos.

Parágrafo único. Para efeito de separação, no cumprimento da pena de prisão, atender-se-á, também, à condição das praças especiais e à das graduadas, ou não; e, dentre as graduadas, à das que tenham graduação especial.', 'Pena até dois anos imposta a militar'),
('61', 'Art. 61 - A pena privativa da liberdade por mais de 2 (dois) anos, aplicada a militar, é cumprida em penitenciária militar e, na falta dessa, em estabelecimento prisional civil, ficando o recluso ou detento sujeito ao regime conforme a legislação penal comum, de cujos benefícios e concessões, também, poderá gozar.', 'Pena superior a dois anos, imposta a militar'),
('62', 'Art. 62 - O civil cumpre a pena aplicada pela Justiça Militar, em estabelecimento prisional civil, ficando ele sujeito ao regime conforme a legislação penal comum, de cujos benefícios e concessões, também, poderá gozar.

Parágrafo único. Por crime militar praticado em tempo de guerra poderá o civil ficar sujeito a cumprir a pena, no todo ou em parte em penitenciária militar, se, em benefício da segurança nacional, assim o determinar a sentença.', 'Pena privativa da liberdade imposta a civil'),
('63', 'Art. 63 - A pena de impedimento sujeita o condenado a permanecer no recinto da unidade, sem prejuízo da instrução militar.', 'Pena de impedimento'),
('66', 'Art. 66 - O condenado a que sobrevenha doença mental deve ser recolhido a manicômio judiciário ou, na falta deste, a outro estabelecimento adequado, onde lhe seja assegurada custódia e tratamento.', 'Superveniência de doença mental'),
('67', 'Art. 67 - Computam-se na pena privativa de liberdade o tempo de prisão provisória, no Brasil ou no estrangeiro, e o de internação em hospital ou manicômio, bem como o excesso de tempo, reconhecido em decisão judicial irrecorrível, no cumprimento da pena, por outro crime, desde que a decisão seja posterior ao crime de que se trata.', 'Tempo computável'),
('68', 'Art. 68 - O condenado pela Justiça Militar de uma região, distrito ou zona pode cumprir pena em estabelecimento de outra região, distrito ou zona.', 'Transferência de condenados');

-- CAPÍTULO II
INSERT INTO "CPM – Código Penal Militar" ("Número do Artigo", "Artigo", "Aula") VALUES
(NULL, 'CAPÍTULO II', NULL),
(NULL, 'DA APLICAÇÃO DA PENA', NULL);

-- Artigos 69 a 83 (TÍTULO V - CAPÍTULO II)
INSERT INTO "CPM – Código Penal Militar" ("Número do Artigo", "Artigo", "Aula") VALUES
('69', 'Art. 69 - Para fixação da pena privativa de liberdade, o juiz aprecia a gravidade do crime praticado e a personalidade do réu, devendo ter em conta a intensidade do dolo ou grau da culpa, a maior ou menor extensão do dano ou perigo de dano, os meios empregados, o modo de execução, os motivos determinantes, as circunstâncias de tempo e lugar, os antecedentes do réu e sua atitude de insensibilidade, indiferença ou arrependimento após o crime.

§ 1º Se são cominadas penas alternativas, o juiz deve determinar qual delas é aplicável.

§ 2º Salvo o disposto no art. 76, é fixada dentro dos limites legais a quantidade da pena aplicável.', 'Fixação da pena privativa de liberdade'),
('70', 'Art. 70 - São circunstâncias que sempre agravam a pena, quando não integrantes ou qualificativas do crime:

I - a reincidência;

II - ter o agente cometido o crime:

a) por motivo fútil ou torpe;

b) para facilitar ou assegurar a execução, a ocultação, a impunidade ou vantagem de outro crime;

c) depois de embriagar-se, salvo se a embriaguez decorre de caso fortuito, engano ou força maior;

d) à traição, de emboscada, com surpresa, ou mediante outro recurso insidioso que dificultou ou tornou impossível a defesa da vítima;

e) com o emprego de veneno, asfixia, tortura, fogo, explosivo, ou qualquer outro meio dissimulado ou cruel, ou de que podia resultar perigo comum;

f) contra ascendente, descendente, irmão ou cônjuge;

g) com abuso de poder ou violação de dever inerente a cargo, ofício, ministério ou profissão;

h) contra criança, pessoa maior de 60 (sessenta) anos, pessoa enferma, mulher grávida ou pessoa com deficiência;

i) quando o ofendido estava sob a imediata proteção da autoridade.', 'Circunstâncias agravantes'),
('71', 'Art. 71 - Verifica-se a reincidência quando o agente comete novo crime, depois de transitar em julgado a sentença que, no país ou no estrangeiro, o tenha condenado por crime anterior.

§ 1º Não se toma em conta, para efeito da reincidência, a condenação anterior, se, entre a data do cumprimento ou extinção da pena e o crime posterior, decorreu período de tempo superior a cinco anos.

§ 2º Para efeito da reincidência, não se consideram os crimes anistiados.', 'Reincidência'),
('72', 'Art. 72 - São circunstâncias que sempre atenuam a pena:

I - ser o agente menor de vinte e um ou maior de setenta anos;

II - ser meritório seu comportamento anterior;

III - ter o agente.

Parágrafo único. Nos crimes em que a pena máxima cominada é de morte, ao juiz é facultado atender, ou não, às circunstâncias atenuantes enumeradas no artigo.', 'Circunstância atenuantes'),
('73', 'Art. 73 - Quando a lei determina a agravação ou atenuação da pena sem mencionar o quantum, deve o juiz fixá-lo entre um quinto e um terço, guardados os limites da pena cominada ao crime.', 'Quantum da agravação ou atenuação'),
('74', 'Art. 74 - Quando ocorre mais de uma agravante ou mais de uma atenuante, o juiz poderá limitar-se a uma só agravação ou a uma só atenuação.', 'Mais de uma agravante ou atenuante'),
('75', 'Art. 75 - No concurso de agravantes e atenuantes, a pena deve aproximar-se do limite indicado pelas circunstâncias preponderantes, entendendo-se como tais as que resultam dos motivos determinantes do crime, da personalidade do agente, e da reincidência. Se há equivalência entre umas e outras, é como se não tivessem ocorrido.', 'Concurso de agravantes e atenuantes'),
('76', 'Art. 76 - Quando a lei prevê causas especiais de aumento ou diminuição da pena, não fica o juiz adstrito aos limites da pena cominada ao crime, senão apenas aos da espécie de pena aplicável (art. 58).

Parágrafo único. No concurso dessas causas especiais, pode o juiz limitar-se a um só aumento ou a uma só diminuição, prevalecendo, todavia, a causa que mais aumente ou diminua.', 'Majorantes e minorantes'),
('77', 'Art. 77 - A pena-base será fixada de acordo com o critério definido no art. 69 deste Código e, em seguida, serão consideradas as circunstâncias atenuantes e agravantes e, por último, as causas de diminuição e de aumento de pena.

Parágrafo único. Salvo na aplicação das causas de diminuição e de aumento, a pena não poderá ser fixada aquém do mínimo nem acima do máximo previsto em abstrato para o crime.', 'Cálculo da pena'),
('79', 'Art. 79 - Quando o agente, mediante mais de uma ação ou omissão, pratica dois ou mais crimes, idênticos ou não, aplicam-se-lhe cumulativamente as penas privativas de liberdade em que haja incorrido.

Parágrafo único. No caso de aplicação cumulativa de penas de reclusão e de detenção, executa-se primeiro aquela.', 'Concurso material'),
('79-A', 'Art. 79-A - Quando o agente, mediante uma só ação ou omissão, pratica dois ou mais crimes, idênticos ou não, aplica-se-lhe a mais grave das penas cabíveis ou, se iguais, somente uma delas, mas aumentada, em qualquer caso, de 1/6 (um sexto) até metade.

§ 1º As penas aplicam-se, entretanto, cumulativamente, se a ação ou omissão é dolosa e os crimes concorrentes resultam de desígnios autônomos, consoante o disposto no art. 79 deste Código.

§ 2º Não poderá a pena exceder a que seria cabível pela regra do art. 79 deste Código.', 'Concurso formal'),
('80', 'Art. 80 - Quando o agente, mediante mais de uma ação ou omissão, pratica dois ou mais crimes da mesma espécie e, pelas condições de tempo, lugar, maneira de execução e outras semelhantes, devem os subsequentes ser havidos como continuação do primeiro, aplica-se-lhe a pena de um só dos crimes, se idênticas, ou a mais grave, se diversas, aumentada, em qualquer caso, de 1/6 (um sexto) a 2/3 (dois terços).

Parágrafo único. Nos crimes dolosos contra vítimas diferentes cometidos com violência ou grave ameaça à pessoa, poderá o juízo, considerando a culpabilidade, os antecedentes, a conduta social e a personalidade do agente, bem como os motivos e as circunstâncias, aumentar a pena de um só dos crimes, se idênticas, ou a mais grave, se diversas, até o triplo, observadas as regras dos §§ 1º e 2º do art. 79-A e do art. 81 deste Código.', 'Crime continuado'),
('81', 'Art. 81 - A pena unificada não pode ultrapassar de trinta anos, se é de reclusão, ou de quinze anos, se é de detenção.

§ 1º A pena unificada pode ser diminuída de um sexto a um quarto, no caso de unidade de ação ou omissão, ou de crime continuado.

§ 2º Quando cominada a pena de morte como grau máximo e a de reclusão como grau mínimo, aquela corresponde, para o efeito de graduação, à de reclusão por trinta anos.

§ 3º Nos crimes punidos com a pena de morte, esta corresponde à de reclusão por trinta anos, para cálculo da pena aplicável à tentativa, salvo disposição especial.', 'Limite da pena unificada'),
('83', 'Art. 83 - As penas não privativas de liberdade são aplicadas distinta e integralmente, ainda que previstas para um só dos crimes concorrentes.', 'Penas não privativas de liberdade');

-- CAPÍTULO III
INSERT INTO "CPM – Código Penal Militar" ("Número do Artigo", "Artigo", "Aula") VALUES
(NULL, 'CAPÍTULO III', NULL),
(NULL, 'DA SUSPENSÃO CONDICIONAL DA PENA', NULL);

-- Artigos 84 a 88 (TÍTULO V - CAPÍTULO III)
INSERT INTO "CPM – Código Penal Militar" ("Número do Artigo", "Artigo", "Aula") VALUES
('84', 'Art. 84 - A execução da pena privativa de liberdade não superior a 2 (dois) anos pode ser suspensa por 3 (três) a 5 (cinco) anos, no caso de pena de reclusão, e por 2 (dois) a 4 (quatro) anos, no caso de pena de detenção, desde que:

I - o sentenciado não haja sofrido no País ou no estrangeiro, condenação irrecorrível por outro crime a pena privativa da liberdade, salvo o disposto no § 1º do art. 71;

II - a culpabilidade, os antecedentes, a conduta social e a personalidade do agente, bem como os motivos e as circunstâncias do crime, autorizem a concessão do benefício.

§ 1º A suspensão não se estende à pena acessória nem exclui a aplicação de medida de segurança não detentiva.

§ 2º A execução da pena privativa de liberdade não superior a 4 (quatro) anos poderá ser suspensa por 4 (quatro) a 6 (seis) anos, desde que o condenado seja maior de 70 (setenta) anos de idade ou existam razões de saúde que justifiquem a suspensão.', 'Pressupostos da suspensão'),
('85', 'Art. 85 - A sentença deve especificar as condições a que fica subordinada a suspensão.', 'Condições'),
('86', 'Art. 86 - A suspensão é revogada se, no curso do prazo, o beneficiário:

I - é condenado por crime doloso, na Justiça Militar ou na Justiça Comum, por sentença irrecorrível;

II - não efetua, sem motivo justificado, a reparação do dano.

§ 1º A suspensão também pode ser revogada se o condenado deixar de cumprir qualquer das obrigações constantes da sentença ou, se militar, for punido por infração disciplinar considerada grave.

§ 2º Quando facultativa a revogação, o juiz pode, ao invés de decretá-la, prorrogar o período de prova até o máximo, se este não foi o fixado.

§ 3º Se o beneficiário está respondendo a processo que, no caso de condenação, pode acarretar a revogação, considera-se prorrogado o prazo da suspensão até o julgamento definitivo.', 'Revogação obrigatória da suspensão'),
('87', 'Art. 87 - Se o prazo expira sem que tenha sido revogada a suspensão, fica extinta a pena privativa de liberdade.', 'Extinção da pena'),
('88', 'Art. 88 - A suspensão condicional da pena não se aplica:

I - ao condenado por crime cometido em tempo de guerra;

II - em tempo de paz.', 'Não aplicação da suspensão condicional da pena');

-- CAPÍTULO IV
INSERT INTO "CPM – Código Penal Militar" ("Número do Artigo", "Artigo", "Aula") VALUES
(NULL, 'CAPÍTULO IV', NULL),
(NULL, 'DO LIVRAMENTO CONDICIONAL', NULL);

-- Artigos 89 a 97 (TÍTULO V - CAPÍTULO IV)
INSERT INTO "CPM – Código Penal Militar" ("Número do Artigo", "Artigo", "Aula") VALUES
('89', 'Art. 89 - O condenado a pena de reclusão ou de detenção por tempo igual ou superior a dois anos pode ser liberado condicionalmente, desde que:

I - tenha cumprido:

a) metade da pena, se primário;

b) dois terços, se reincidente;

II - tenha reparado, salvo impossibilidade de fazê-lo, o dano causado pelo crime;

III - sua boa conduta durante a execução da pena, sua adaptação ao trabalho e às circunstâncias atinentes a sua personalidade, ao meio social e à sua vida pregressa permitem supor que não voltará a delinqüir.

§ 1º No caso de condenação por infrações penais em concurso, deve ter-se em conta a pena unificada.

§ 2º Se o condenado é primário e menor de vinte e um ou maior de setenta anos, o tempo de cumprimento da pena pode ser reduzido a um terço.', 'Requisitos'),
('90', 'Art. 90 - A sentença deve especificar as condições a que fica subordinado o livramento.', 'Especificações das condições'),
('91', 'Art. 91 - O livramento somente se concede mediante parecer do Conselho Penitenciário, ouvidos o diretor do estabelecimento em que está ou tenha estado o liberando e o representante do Ministério Público da Justiça Militar; e, se imposta medida de segurança detentiva, após perícia conclusiva da não periculosidade do liberando.', 'Preliminares da concessão'),
('92', 'Art. 92 - O liberado fica sob observação cautelar e proteção realizadas por patronato oficial ou particular, dirigido aquele e inspecionado este pelo Conselho Penitenciário. Na falta de patronato, o liberado fica sob observação cautelar realizada por serviço social penitenciário ou órgão similar.', 'Observação cautelar e proteção do liberado'),
('93', 'Art. 93 - Revoga-se o livramento, se o liberado vem a ser condenado, em sentença irrecorrível, a pena privativa de liberdade:

I - por infração penal cometida durante a vigência do benefício;

II - por infração penal anterior, salvo se, tendo de ser unificadas as penas, não fica prejudicado o requisito do art. 89, nº I, letra a.

§ 1º O juiz pode, também, revogar o livramento se o liberado deixa de cumprir qualquer das obrigações constantes da sentença ou é irrecorrìvelmente condenado, por motivo de contravenção, a pena que não seja privativa de liberdade; ou, se militar, sofre penalidade por transgressão disciplinar considerada grave.

§ 2º Para os efeitos da revogação obrigatória, são tomadas, também, em consideração, nos termos dos ns. I e II deste artigo, as infrações sujeitas à jurisdição penal comum; e, igualmente, a contravenção compreendida no § 1º, se assim, com prudente arbítrio, o entender o juiz.', 'Revogação obrigatória'),
('94', 'Art. 94 - Revogado o livramento, não pode ser novamente concedido e, salvo quando a revogação resulta de condenação por infração penal anterior ao benefício, não se desconta na pena o tempo em que esteve solto o condenado.', 'Efeitos da revogação'),
('95', 'Art. 95 - Se, até o seu termo, o livramento não é revogado, considera-se extinta a pena privativa de liberdade.

Parágrafo único. Enquanto não passa em julgado a sentença em processo, a que responde o liberado por infração penal cometida na vigência do livramento, deve o juiz abster-se de declarar a extinção da pena.', 'Extinção da pena'),
('96', 'Art. 96 - O livramento condicional não se aplica ao condenado por crime cometido em tempo de guerra.', 'Não aplicação do livramento condicional'),
('97', 'Art. 97 - Em tempo de paz, o livramento condicional por crime contra a segurança externa do país, ou de revolta, motim, aliciação e incitamento, violência contra superior ou militar de serviço, só será concedido após o cumprimento de dois terços da pena, observado ainda o disposto no art. 89, preâmbulo, seus números II e III e §§ 1º e 2º.', 'Casos especiais do livramento condicional');

-- CAPÍTULO V
INSERT INTO "CPM – Código Penal Militar" ("Número do Artigo", "Artigo", "Aula") VALUES
(NULL, 'CAPÍTULO V', NULL),
(NULL, 'DAS PENAS ACESSÓRIAS', NULL);

-- Artigos 98 a 100 (TÍTULO V - CAPÍTULO V) - FASE 1 FINAL
INSERT INTO "CPM – Código Penal Militar" ("Número do Artigo", "Artigo", "Aula") VALUES
('98', 'Art. 98 - São penas acessórias:

I - a perda de posto e patente;

II - a indignidade para o oficialato;

III - a incompatibilidade com o oficialato;

IV - a exclusão das forças armadas;

V - a perda da função pública, ainda que eletiva;

VI - a inabilitação para o exercício de função pública;

VII - a incapacidade para o exercício do poder familiar, da tutela ou da curatela, quando tal medida for determinante para salvaguardar os interesses do filho, do tutelado ou do curatelado;

VIII - a suspensão dos direitos políticos.

Parágrafo único. Equipara-se à função pública a que é exercida em empresa pública, autarquia, sociedade de economia mista, ou sociedade de que participe a União, o Estado ou o Município como acionista majoritário.', 'Penas acessórias'),
('99', 'Art. 99 - A perda de posto e patente resulta da condenação a pena privativa de liberdade por tempo superior a 2 (dois) anos, por crimes comuns e militares, e importa a perda das condecorações, desde que submetido o oficial ao julgamento previsto no inciso VI do § 3º do art. 142 da Constituição Federal.', 'Perda de posto e patente'),
('100', 'Art. 100 - Fica sujeito à declaração de indignidade para o oficialato o militar condenado, qualquer que seja a pena, nos crimes de traição, espionagem ou cobardia, ou em qualquer dos definidos nos arts. 161, 235, 240, 242, 243, 244, 245, 251, 252, 303, 304, 311 e 312.', 'Indignidade para o oficialato');