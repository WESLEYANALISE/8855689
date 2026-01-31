
# Plano: Alinhar Prompts de Conceitos com OAB Trilhas - Tom Conversacional e Fluido

## Problema Identificado

Após comparar os prompts de `gerar-conteudo-oab-trilhas` com `gerar-conteudo-conceitos`, identifiquei as seguintes diferenças críticas:

### Comparação dos Estilos

| Aspecto | OAB Trilhas (Correto) | Conceitos (Atual) |
|---------|----------------------|-------------------|
| **Introdução** | Saudação acolhedora: "Vamos falar sobre um tema super importante..." | Proíbe saudações completamente |
| **Tom geral** | Conversacional: "Olha só, é assim que funciona...", "Entendeu a lógica?" | Direto ao ponto, seco, sem interação |
| **Explicação de termos técnicos** | Explica no momento: "...o que significa que..." | Só lista os termos, não explica inline |
| **Exemplos** | Cita exemplos rápidos durante a explicação | Exemplos só na página dedicada |
| **Desmembrando** | "Olha, isso parece complicado, mas vou te mostrar passo a passo..." | Estrutura rígida com bullets (Premissas, Aplicação, etc.) |
| **Entendendo na Prática** | "Imagina a seguinte situação..." - usa o TEMA do PDF | Casos genéricos desconectados |
| **Dicas** | "Olha esse truque que vai salvar sua vida na prova..." | Estrutura formal com ### Mnemônicos |

---

## Alterações Planejadas

### Arquivo: `supabase/functions/gerar-conteudo-conceitos/index.ts`

#### 1. Atualizar `promptBase` (linhas 484-540)
Substituir o estilo "direto ao ponto" pelo estilo CONVERSACIONAL do OAB Trilhas:

**De (atual):**
```text
Você é um professor de Direito didático e objetivo.
Seu estilo é DIRETO AO PONTO - você explica os conceitos de forma clara sem enrolação.
⛔ PROIBIDO: NÃO comece com saudações...
```

**Para (igual OAB Trilhas):**
```text
Você é um professor de Direito descontraído, didático e apaixonado por ensinar.
Seu estilo é como uma CONVERSA COM UM AMIGO - você explica os conceitos como se estivesse tomando um café e ajudando um colega a entender a matéria.

## 🎯 SEU ESTILO DE ESCRITA OBRIGATÓRIO:

### ✅ FAÇA SEMPRE:
- Escreva como se estivesse CONVERSANDO com o estudante
- Use expressões naturais como:
  • "Olha só, é assim que funciona..."
  • "Veja bem, isso é super importante porque..."
  • "Percebeu a diferença? Esse é o pulo do gato!"
  • "Agora vem a parte interessante..."
  • "Resumindo pra você não esquecer..."
- Use perguntas retóricas para engajar ("E por que isso importa tanto?")
- Faça analogias com situações do dia a dia
- A cada termo técnico, EXPLIQUE o que significa: "...a personalidade civil, ou seja, a capacidade de ser titular de direitos..."
- Cite exemplos rápidos DURANTE a explicação, não depois
- Após conceitos complexos, faça um breve resumo informal

### ❌ NÃO FAÇA:
- Linguagem excessivamente formal/acadêmica
- Parágrafos longos e densos sem pausas
- Texto que pareça copiado de um livro jurídico
- Repetir vícios de linguagem (não use a mesma expressão mais de 2x)
- **NUNCA USE EMOJIS NO TEXTO CORRIDO**
```

#### 2. Atualizar Prompt da Introdução (linhas 13-40)
Permitir saudação acolhedora SOMENTE na introdução:

**Para:**
```text
Esta é a ÚNICA página que deve ter saudação.
Comece com algo acolhedor: "Vamos falar sobre um tema super importante pra você entender..."

Escreva 150-250 palavras MÁXIMO contendo:
1. Saudação acolhedora e motivadora (1-2 frases)
2. Contexto: por que isso é relevante (1-2 frases)
3. Lista de 3-5 pontos-chave que serão abordados
4. "Ao final dessa trilha, você vai dominar..."

Termine com:
> 🎯 **VOCÊ SABIA?:** [curiosidade relevante]
```

#### 3. Atualizar Prompt do Conteúdo Completo (linhas 43-80)
Adicionar estilo fluido com exemplos inline e explicação de termos:

**Para:**
```text
Vá DIRETO ao conteúdo (a introdução já fez a saudação).
Escreva com tom CONVERSACIONAL e FLUIDO - como se explicasse para um amigo.

REGRAS DE FLUIDEZ:
1. A cada termo técnico, EXPLIQUE imediatamente: "...a capacidade civil, ou seja, a aptidão de exercer direitos..."
2. Cite exemplos DURANTE a explicação, não depois: "Por exemplo, quando alguém vende um carro sem procuração..."
3. Use transições naturais: "Agora que você entendeu X, vamos ver Y..."
4. Antecipe dúvidas: "Você pode estar pensando: e se...? A resposta é..."

Use os títulos ORIGINAIS do PDF (ex: "## 1. Escola Clássica").
Inclua tabelas comparativas quando houver institutos para comparar.
Mínimo 3000 palavras cobrindo TODO o PDF.
```

#### 4. Atualizar Prompt do Desmembrando (linhas 83-110)
Substituir estrutura rígida por análise fluida igual OAB Trilhas:

**De (atual):**
```text
### [Nome do Conceito]
*   **Premissas:** [...]
*   **Aplicação:** [...]
*   **Consequências:** [...]
*   **Exemplo:** [...]
```

**Para (igual OAB Trilhas):**
```text
Pegue os conceitos-chave do PDF e DESTRINCHE cada um com tom de conversa.

Para CADA conceito:
"Olha, isso parece complicado, mas vou te mostrar passo a passo..."

### [Nome do Conceito]
Explique o conceito de forma FLUIDA, como se estivesse conversando.
Não use listas rígidas - escreva em parágrafos naturais.
Cite exemplos práticos DURANTE a explicação.
Ao final de cada conceito, faça um resumo rápido: "Então, resumindo: ..."

Use perguntas retóricas: "E por que isso é tão importante? Porque..."
Faça analogias: "Pense como se fosse..."
```

#### 5. Atualizar Prompt do Entendendo na Prática (linhas 113-132)
Usar o TEMA DO PDF para criar casos práticos reais:

**Para:**
```text
Crie casos práticos usando ESPECIFICAMENTE o tema estudado no PDF.
Não invente situações genéricas - use os conceitos que estão no material.

Estrutura para cada caso:
"Imagina a seguinte situação..."
> 💼 **CASO PRÁTICO:** [Situação real baseada no tema do PDF]

Análise: [Como aplicar o que foi estudado - conecte com o conteúdo]
Conclusão: [O que acontece juridicamente]

IMPORTANTE: Os casos devem refletir o DIA A DIA da aplicação do tema.
Se o tema é "Escolas Penais", crie casos sobre como cada escola interpretaria um crime.
Se o tema é "Personalidade Civil", crie casos sobre início/fim da personalidade.
```

#### 6. Atualizar Prompt das Dicas para Memorizar (linhas 185-207)
Usar estilo amigável igual OAB Trilhas:

**Para:**
```text
"Olha esse truque que vai salvar sua vida na prova..."

Forneça dicas de memorização com tom amigável (400-600 palavras):

### Mnemônicos que Funcionam
"Quer uma dica? Pensa assim: [SIGLA] = [Significado]"

### Pegadinhas que Sempre Caem
"Cuidado com essa aqui..."
> ⚠️ **PEGADINHA:** [ponto que confunde em provas]

### Macetes de Prova
"Quando você ver [X] na questão, já sabe que..."
> 💡 **DICA:** [macete específico]

Use linguagem amigável, não acadêmica.
"Decora assim que não esquece nunca mais..."
```

---

## Resumo das Mudanças

| Seção | Antes | Depois |
|-------|-------|--------|
| **Introdução** | Proíbe saudações | Permite saudação acolhedora |
| **Conteúdo** | Explicação seca | Fluido com exemplos inline + explicação de termos técnicos |
| **Desmembrando** | Bullets rígidos (Premissas, Aplicação...) | Parágrafos conversacionais |
| **Entendendo na Prática** | Casos genéricos | Casos baseados no TEMA do PDF |
| **Dicas** | Estrutura formal | Tom amigável: "Olha esse truque..." |
| **Tom geral** | "Direto ao ponto" | "Conversando com um amigo" |

---

## Impacto

Após as alterações, o conteúdo de Conceitos terá:
1. **Introdução acolhedora** com saudação motivadora
2. **Explicação fluida** que cita exemplos DURANTE o texto
3. **Termos técnicos explicados** no momento que aparecem
4. **Tom conversacional** sem vícios de linguagem
5. **Casos práticos** conectados diretamente ao tema do PDF
6. **Dicas amigáveis** com linguagem de "dica de amigo"

Os tópicos existentes precisarão ser regenerados para aplicar o novo formato.
