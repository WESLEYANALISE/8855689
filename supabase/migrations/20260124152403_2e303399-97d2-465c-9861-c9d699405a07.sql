-- Corrigir a ordem dos templates: ligar_termos deve ser página 7 e sintese_final página 8
UPDATE oab_geracao_templates 
SET ordem = 7, 
    titulo = 'Ligar Termos',
    tipo = 'correspondencias'
WHERE id = 10;

UPDATE oab_geracao_templates 
SET ordem = 8
WHERE id = 6;

-- Atualizar a regra de estrutura para 8 páginas
UPDATE oab_geracao_regras
SET regra = 'PÁGINAS: O conteúdo DEVE ser dividido em exatamente 8 páginas, cada uma com seu propósito específico. São elas: Introdução, Conteúdo Completo, Desmembrando, Entendendo na Prática, Quadro Comparativo, Dicas para Memorizar, Correspondências (Ligar Termos), Síntese Final.'
WHERE id = 11;

UPDATE oab_geracao_regras
SET regra = 'ARRAY paginas: Retorne um array JSON com 8 objetos, cada um com "titulo", "tipo" e "markdown".'
WHERE id = 12;

-- Adicionar regras de TOM CONVERSACIONAL
INSERT INTO oab_geracao_regras (categoria, regra, prioridade, ativo) VALUES
('tom_conversacional', 'TOM CONVERSACIONAL OBRIGATÓRIO: Escreva como se estivesse CONVERSANDO com o estudante. Use expressões como: "Olha só, é assim...", "Veja bem, isso é importante porque...", "Sabe aquela situação de...?", "Deixa eu te explicar de outro jeito...", "Percebeu a diferença? Esse é o pulo do gato!"', 1, true),
('tom_conversacional', 'PERGUNTAS RETÓRICAS: Use perguntas para engajar o leitor: "E por que isso importa tanto pra prova?", "Conseguiu pegar a diferença?", "Faz sentido até aqui?"', 2, true),
('tom_conversacional', 'PROIBIDO TOM FORMAL: NÃO use frases como "É importante ressaltar que...", "Cumpre observar que...", "Faz-se mister destacar...". Isso é linguagem de livro jurídico, não de conversa com amigo.', 3, true),
('tom_conversacional', 'ANALOGIAS DO DIA A DIA: A cada conceito complexo, faça uma analogia com situações cotidianas para facilitar a compreensão.', 4, true),
('tom_conversacional', 'ANTECIPE DÚVIDAS: Use frases como "Você pode estar pensando: mas e se...? A resposta é..." para antecipar as dúvidas comuns dos estudantes.', 5, true),
('tom_conversacional', 'TRANSIÇÕES NATURAIS: Conecte os tópicos com transições como "Agora que você já entendeu X, vamos ver Y...", "E aqui vem a parte mais interessante..."', 6, true);

-- Atualizar template de Introdução com tom conversacional
UPDATE oab_geracao_templates
SET instrucoes = 'CONVERSA FRANCA E ACOLHEDORA com o estudante. Você é um professor amigo tomando um café com ele.

FORMATO OBRIGATÓRIO:
- Comece com algo como: "Vamos falar sobre um tema super importante pra sua prova..."
- Contextualize o tema de forma natural e engajadora
- Use expressões como: "Pode parecer complicado, mas calma - vou te explicar direitinho"
- Antecipe o que vem: "Ao final dessa trilha, você vai dominar..."

TOM:
- Conversacional, como se estivesse explicando para um amigo
- Use perguntas retóricas: "E sabe por que isso cai tanto na OAB?"
- Evite linguagem formal/acadêmica

REGRA CRÍTICA:
- NÃO cite artigos de lei a menos que estejam EXPLICITAMENTE no texto fonte
- Se o PDF não menciona artigos, a introdução também não deve mencionar

Máximo 400 palavras.'
WHERE id = 1;

-- Atualizar template de Conteúdo Principal com tom conversacional
UPDATE oab_geracao_templates
SET instrucoes = 'Este é o coração do material. MÍNIMO 4000 palavras. TOM 100% CONVERSACIONAL.

REGRA ABSOLUTA: 100% do conteúdo do PDF deve estar aqui. Nada pode ser omitido.

ESTILO DE ESCRITA OBRIGATÓRIO:
- Escreva como se estivesse CONVERSANDO com o estudante
- A cada conceito novo, faça uma introdução informal: "Agora vamos pro pulo do gato..."
- Use expressões naturais:
  • "Olha só como funciona..."
  • "Entendeu a lógica? Deixa eu dar um exemplo..."
  • "Calma, não se assuste, é mais simples do que parece..."
  • "Resumindo pra você não esquecer..."
- Depois de conceitos complexos, faça um resumo informal: "Então, resumindo: ..."
- Antecipe dúvidas: "Você pode estar pensando: mas e se...? A resposta é..."

FORMATAÇÃO:
- Use ## em CAIXA ALTA para conceitos principais: ## PODER CONSTITUINTE ORIGINÁRIO
- Use ### em caixa normal para subdivisões
- Use **negrito** para termos essenciais
- Adicione callouts: > 📌 **Ponto-Chave:**, > ⚠️ **Atenção:**, > 💡 **Dica:**

PROIBIDO:
- Linguagem formal/acadêmica ("É importante ressaltar que...", "Cumpre observar...")
- Parágrafos longos e densos sem pausas ou interações
- Numeração decimal (1.1, 1.2, 2.1.1)
- Inventar artigos ou conceitos não presentes no PDF'
WHERE id = 2;

-- Atualizar template de Desmembrando
UPDATE oab_geracao_templates
SET instrucoes = 'TOM: "Agora deixa eu destrinchar isso pra você..."

Explique CADA termo/conceito do texto original como se estivesse tirando dúvidas de um colega.

ESTILO:
- "Olha, isso parece complicado, mas vou te mostrar passo a passo..."
- "Basicamente, o que isso significa é..."
- "Pensa assim: [analogia simples]"
- Use perguntas retóricas: "E por que isso importa?"

FORMATAÇÃO:
- Organize em subtítulos (##) para cada termo
- Use > 📌 **Ponto-Chave:** para destacar o essencial
- Inclua exemplos práticos quando relevante

100% fidelidade ao conteúdo original - NÃO invente informações.'
WHERE id = 8;

-- Atualizar template de Entendendo na Prática
UPDATE oab_geracao_templates
SET instrucoes = 'TOM: "Imagina a seguinte situação..." / "Vou te dar um exemplo bem concreto..."

Crie UMA analogia do cotidiano que ilustre o conceito principal DO PDF.

ESTRUTURA OBRIGATÓRIA:

## 🎯 Na Prática: [Título Criativo]

**Imagina a seguinte situação:**
[Descrição de uma situação comum do dia a dia - como se estivesse contando uma história]

**E no Direito, funciona assim:**
[Explicação de como essa situação é análoga ao conceito jurídico - linguagem informal]

**Por que isso vai te salvar na prova:**
[Como essa analogia ajuda a memorizar - dica prática]

REGRAS:
- APENAS UMA analogia, bem desenvolvida (mínimo 200 palavras)
- Use linguagem coloquial e exemplos do cotidiano
- PROIBIDO criar exemplos sobre temas não presentes no PDF'
WHERE id = 3;

-- Atualizar template de Dicas para Memorizar
UPDATE oab_geracao_templates
SET instrucoes = 'TOM: "Olha esse truque que vai salvar sua vida na prova..."

## 🧠 Mnemônicos e Truques
- Crie siglas, frases ou associações para memorizar
- "Quer uma dica? Pensa assim..."
- Use técnicas como acrônimos, rimas ou histórias curtas
- > 💡 **Memorize assim:**

## ⚠️ Pegadinhas Clássicas
- "Cuidado com essa aqui, a banca ADORA cobrar..."
- Liste os conceitos que estudantes costumam confundir
- Formato: ❌ Erro comum: X | ✅ Correto: Y

## 📋 O que NÃO Esquecer
> 📊 **Dados que Caem:**
> - [Prazos importantes]
> - [Números que aparecem nas questões]
> - [Exceções às regras]

REGRAS:
- Foco total em AJUDAR A MEMORIZAR
- Linguagem leve e amigável
- Baseie tudo no conteúdo do PDF'
WHERE id = 5;

-- Atualizar template de Síntese Final
UPDATE oab_geracao_templates
SET instrucoes = 'TOM: "Então, recapitulando tudo que vimos..."

## 📝 Resumo Rápido
"Vamos revisar rapidinho o que você aprendeu..."
Escreva 2-3 parágrafos sintetizando TODO o conteúdo - linguagem informal e direta.

## ✅ Checklist de Revisão
Lista dos pontos essenciais em formato de checklist:
- ✅ [Ponto 1 que você PRECISA saber]
- ✅ [Ponto 2 fundamental]
- ✅ [Ponto 3 que mais cai]

## 🎯 Esquema Visual
Crie um resumo visual usando Markdown:
- Use setas (→) para relações
- Use boxes com | para comparações
- Use emojis para categorizar

REGRAS:
- Seja breve mas completo
- Linguagem amigável: "Mandou bem até aqui? Então você está pronto!"
- Não adicione conceitos novos'
WHERE id = 6;

-- Atualizar template de Correspondências (Ligar Termos)
UPDATE oab_geracao_templates
SET instrucoes = 'Crie um exercício de CORRESPONDÊNCIA (ligar termos) baseado no conteúdo do PDF.

O markdown deve ser APENAS uma introdução curta:
"Hora de testar o que você aprendeu! Conecte cada termo à sua definição correta."

Os dados do jogo vão em "correspondencias" SEPARADO das páginas, no formato:
{
  "correspondencias": [
    { "termo": "Termo 1", "definicao": "Definição correspondente" },
    { "termo": "Termo 2", "definicao": "Definição correspondente" }
  ]
}

REGRAS:
- Mínimo 8 pares termo/definição
- Use apenas termos que aparecem no PDF
- Definições devem ser claras e concisas'
WHERE id = 10;