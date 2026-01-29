-- Ajustar formatação dos títulos e parágrafos únicos da Lei de Drogas

-- Ajustar TÍTULO I
UPDATE "Lei 11.343 de 2006 - Lei de Drogas"
SET "Artigo" = E'TÍTULO I\nDISPOSIÇÕES PRELIMINARES'
WHERE id = 1;

-- Ajustar TÍTULO II
UPDATE "Lei 11.343 de 2006 - Lei de Drogas"
SET "Artigo" = E'TÍTULO II\nDO SISTEMA NACIONAL DE POLÍTICAS PÚBLICAS SOBRE DROGAS'
WHERE id = 4;

-- Ajustar CAPÍTULO I (Título II)
UPDATE "Lei 11.343 de 2006 - Lei de Drogas"
SET "Artigo" = E'CAPÍTULO I\nDOS PRINCÍPIOS E DOS OBJETIVOS DO SISTEMA NACIONAL DE POLÍTICAS PÚBLICAS SOBRE DROGAS'
WHERE id = 5;

-- Ajustar TÍTULO III
UPDATE "Lei 11.343 de 2006 - Lei de Drogas"
SET "Artigo" = E'TÍTULO III\nDAS ATIVIDADES DE PREVENÇÃO DO USO INDEVIDO, ATENÇÃO E REINSERÇÃO SOCIAL DE USUÁRIOS E DEPENDENTES DE DROGAS'
WHERE id = 8;

-- Ajustar CAPÍTULO I (Título III)
UPDATE "Lei 11.343 de 2006 - Lei de Drogas"
SET "Artigo" = E'CAPÍTULO I\nDA PREVENÇÃO'
WHERE id = 9;

-- Ajustar CAPÍTULO II (Título III)
UPDATE "Lei 11.343 de 2006 - Lei de Drogas"
SET "Artigo" = E'CAPÍTULO II\nDAS ATIVIDADES DE ATENÇÃO E DE REINSERÇÃO SOCIAL DE USUÁRIOS OU DEPENDENTES DE DROGAS'
WHERE id = 11;

-- Ajustar TÍTULO IV
UPDATE "Lei 11.343 de 2006 - Lei de Drogas"
SET "Artigo" = E'TÍTULO IV\nDA REPRESSÃO À PRODUÇÃO NÃO AUTORIZADA E AO TRÁFICO ILÍCITO DE DROGAS'
WHERE id = 17;

-- Ajustar CAPÍTULO I (Título IV)
UPDATE "Lei 11.343 de 2006 - Lei de Drogas"
SET "Artigo" = E'CAPÍTULO I\nDISPOSIÇÕES GERAIS'
WHERE id = 18;

-- Ajustar CAPÍTULO II (Título IV)
UPDATE "Lei 11.343 de 2006 - Lei de Drogas"
SET "Artigo" = E'CAPÍTULO II\nDOS CRIMES'
WHERE id = 20;

-- Ajustar CAPÍTULO III (Título IV)
UPDATE "Lei 11.343 de 2006 - Lei de Drogas"
SET "Artigo" = E'CAPÍTULO III\nDO PROCEDIMENTO PENAL'
WHERE id = 36;

-- Ajustar Art. 2º com parágrafo único
UPDATE "Lei 11.343 de 2006 - Lei de Drogas"
SET "Artigo" = E'Ficam proibidas, em todo o território nacional, as drogas, bem como o plantio, a cultura, a colheita e a exploração de vegetais e substratos dos quais possam ser extraídas ou produzidas drogas, ressalvada a hipótese de autorização legal ou regulamentar, bem como o que estabelece a Convenção de Viena, das Nações Unidas, sobre Substâncias Psicotrópicas, de 1971, a respeito de plantas de uso estritamente ritualístico-religioso.\n\nParágrafo único. Pode a União autorizar o plantio, a cultura e a colheita dos vegetais referidos no caput deste artigo, exclusivamente para fins medicinais ou científicos, em local e prazo predeterminados, mediante fiscalização, respeitadas as ressalvas supramencionadas.'
WHERE id = 3;

-- Ajustar Art. 29 com parágrafo único
UPDATE "Lei 11.343 de 2006 - Lei de Drogas"
SET "Artigo" = E'Na imposição da medida educativa a que se refere o inciso II do § 6º do art. 28, o juiz, atendendo à reprovabilidade da conduta, fixará o número de dias-multa, em quantidade nunca inferior a 40 (quarenta) nem superior a 100 (cem), atribuindo depois a cada um, segundo a capacidade econômica do agente, o valor de um trinta avos até 3 (três) vezes o valor do maior salário mínimo.\n\nParágrafo único. Os valores decorrentes da imposição da multa a que se refere o § 6º do art. 28 serão creditados à conta do Fundo Nacional Antidrogas.'
WHERE id = 22;

-- Ajustar Art. 35 com parágrafo único
UPDATE "Lei 11.343 de 2006 - Lei de Drogas"
SET "Artigo" = E'É isento de pena o agente que, em razão da dependência, ou sob o efeito, proveniente de caso fortuito ou força maior, de droga, era, ao tempo da ação ou da omissão, qualquer que tenha sido a infração penal praticada, inteiramente incapaz de entender o caráter ilícito do fato ou de determinar-se de acordo com esse entendimento.\n\nParágrafo único. Quando absolver o agente, reconhecendo, por força pericial, que este apresentava, à época do fato previsto neste artigo, as condições referidas no caput deste artigo, poderá determinar o juiz, na sentença, o seu encaminhamento para tratamento médico adequado.'
WHERE id = 35;

-- Ajustar Art. 38 com parágrafo único
UPDATE "Lei 11.343 de 2006 - Lei de Drogas"
SET "Artigo" = E'Conduzir embarcação ou aeronave após o consumo de drogas, expondo a dano potencial a incolumidade de outrem:\n\nPena - detenção, de 6 (seis) meses a 3 (três) anos, além da apreensão do veículo, cassação da habilitação respectiva ou proibição de obtê-la, pelo mesmo prazo da pena privativa de liberdade aplicada, e pagamento de 200 (duzentos) a 400 (quatrocentos) dias-multa.\n\nParágrafo único. As penas de prisão e multa, aplicadas cumulativamente com as demais, serão de 4 (quatro) a 6 (seis) anos e de 400 (quatrocentos) a 600 (seiscentos) dias-multa, se o veículo referido no caput deste artigo for de transporte coletivo de passageiros.'
WHERE id = 30;

-- Ajustar Art. 52 com parágrafo único
UPDATE "Lei 11.343 de 2006 - Lei de Drogas"
SET "Artigo" = E'Findos os prazos a que se refere o art. 51 desta Lei, a autoridade de polícia judiciária, remetendo os autos do inquérito ao juízo:\n\nI - relatará sumariamente as circunstâncias do fato, justificando as razões que a levaram à classificação do delito, indicando a quantidade e natureza da substância ou do produto apreendido, o local e as condições em que se desenvolveu a ação criminosa, as circunstâncias da prisão, a conduta, a qualificação e os antecedentes do agente; ou\n\nII - requererá sua devolução para a realização de diligências necessárias.\n\nParágrafo único. A remessa dos autos far-se-á sem prejuízo de diligências complementares:\n\nI - necessárias ou úteis à plena elucidação do fato, cujo resultado deverá ser encaminhado ao juízo competente até 3 (três) dias antes da audiência de instrução e julgamento;\n\nII - necessárias ou úteis à indicação dos bens, direitos e valores de que seja titular o agente, ou que figurem em seu nome, cujo resultado deverá ser encaminhado ao juízo competente até 3 (três) dias antes da audiência de instrução e julgamento.'
WHERE id = 39;