

# Plano: Remover Saudações Repetidas e Tornar Conteúdo Mais Dinâmico

## Problema Identificado

O conteúdo gerado está:
1. **Repetindo "Futuro colega" em todos os slides** - deve aparecer APENAS na introdução
2. **Faltando cards visuais** como "⚠️ ATENÇÃO", "💡 DICA DE PROVA" para melhor hierarquia
3. **Linguagem ainda técnica demais** - faltando mais analogias e explicações progressivas
4. **Slides muito uniformes** - parecem "aula escrita", não "aula dinâmica"

---

## Mudancas Propostas

### 1. Reforcar a Proibicao de Saudacoes (Prompts)

Vou modificar os prompts para deixar absolutamente claro que:

**ANTES (problemático):**
```text
## 🎯 ESTILO DE ESCRITA:
- Tom profissional e respeitoso: "Futuro colega,", "Prezado advogado em formação,"
```

**DEPOIS (corrigido):**
```text
## ⛔ REGRA ABSOLUTA DE SAUDAÇÃO:
- SAUDAÇÃO (ex: "Futuro colega", "Olá", "Vamos lá") APENAS no slide "introducao" da PRIMEIRA seção
- Em TODOS os outros slides: COMECE DIRETO NO CONTEÚDO TÉCNICO

✅ COMO INICIAR SLIDES NORMAIS (não introdução):
- "A jurisdição caracteriza-se por..."
- "O escopo jurídico consiste em..."
- "Quando falamos de 'tutela jurisdicional', estamos nos referindo a..."
- "É fundamental compreender que..."

❌ NUNCA USE FORA DA INTRODUÇÃO:
- "Futuro colega,..."
- "Olá!" / "Vamos lá!" / "E aí!"
- "Bora entender..." / "Partiu!"
```

---

### 2. Adicionar Mais Cards Visuais (Atencao, Dica, Exemplo)

Vou reforcar a instrucao para que o modelo gere mais variedade de tipos de slide:

```text
## 🎨 HIERARQUIA VISUAL (OBRIGATÓRIO):
Cada 2-3 slides de "texto" DEVEM ser seguidos por um slide visual diferente:

- Tipo "atencao": Para pegadinhas e pontos críticos
  > ⚠️ **ATENÇÃO!** Muitos candidatos erram aqui...

- Tipo "dica": Para macetes de memorização
  > 💡 **DICA DE PROVA:** Para lembrar os escopos da jurisdição...

- Tipo "caso": Para exemplos práticos
  > 📚 **NA PRÁTICA:** João ajuizou uma ação e...

- Tipo "termos": Para glossário de termos importantes
- Tipo "quickcheck": Para verificação de aprendizado

NUNCA gere mais de 3 slides tipo "texto" consecutivos sem intercalar com outro tipo!
```

---

### 3. Melhorar a Funcao de Limpeza de Saudacoes

A função `limparSaudacoesProibidas` já existe mas precisa capturar mais padrões:

**Adicionar ao regex:**
```typescript
const saudacoesProibidas = [
  // Padrões existentes...
  /^Futuro\s+colega,?\s*/gi,           // NOVO
  /^Prezado\s+(advogado|colega)[^.]*,?\s*/gi,  // NOVO
  /^Caro\s+(colega|estudante|futuro)[^.]*,?\s*/gi,  // NOVO
  /^Olá[!,.\s]*/gi,                    // NOVO
  /^Bem-vind[oa][!,.\s]*/gi,           // NOVO
  /^Vamos\s+(lá|juntos|estudar|mergulhar)[!,.\s]*/gi,  // NOVO melhorado
];
```

---

### 4. Reformular a Secao de Linguagem Acessivel

Vou deixar mais claro que a linguagem acessível é sobre EXPLICAR TERMOS, não sobre ser casual:

**ANTES:**
```text
- Tom profissional e respeitoso: "Futuro colega,", "Prezado advogado em formação,"
```

**DEPOIS:**
```text
## 🎓 LINGUAGEM ACESSÍVEL = DESCOMPLICAR, NÃO CASUALIZAR

A linguagem acessível significa:
1. EXPLICAR todo termo jurídico IMEDIATAMENTE após usá-lo
2. TRADUZIR expressões em latim com contexto prático
3. USAR ANALOGIAS do dia a dia para conceitos abstratos
4. Não significa usar gírias ou saudações informais

EXEMPLO CORRETO:
"A 'jurisdição' (que é o poder-dever do Estado de resolver conflitos) possui três escopos principais. 
Pense neles como os três 'objetivos' que o Estado busca alcançar quando você aciona a Justiça..."

EXEMPLO ERRADO:
"E aí, futuro colega! Vamos falar de jurisdição? Bora lá entender isso!"
```

---

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/gerar-conteudo-oab-trilhas/index.ts` | Atualizar promptBase (linhas 325-412), melhorar regex de limpeza (linhas 415-434) |
| `supabase/functions/gerar-conteudo-resumo-oab/index.ts` | Atualizar promptBase (linhas 182-249), melhorar regex de limpeza (linhas 252-271) |
| `supabase/functions/gerar-slides-artigo/index.ts` | Atualizar prompt principal (linhas 174-248) |

---

## Detalhamento das Mudancas no Codigo

### Arquivo 1: `gerar-conteudo-oab-trilhas/index.ts`

**Linhas 325-412 - Atualizar promptBase:**

```typescript
const promptBase = `Você é um professor de Direito criando conteúdo didático para candidatos à OAB.

## ⛔⛔⛔ REGRA ABSOLUTA - SAUDAÇÕES (LEIA COM ATENÇÃO!) ⛔⛔⛔

🚫 PROIBIDO EM QUALQUER SLIDE QUE NÃO SEJA "introducao" DA PRIMEIRA SEÇÃO:
- "Futuro colega,", "Prezado advogado,", "Caro estudante,"
- "Olá!", "Bem-vindo!", "Vamos lá!", "Bora!"
- "E aí?", "Partiu!", "Tá preparado?"
- QUALQUER saudação ou vocativo no início

✅ OBRIGATÓRIO - Como iniciar slides normais:
- "A jurisdição caracteriza-se por..." (direto no conceito)
- "O escopo jurídico representa..." (direto na definição)
- "Quando analisamos o conceito de..." (direto na análise)
- "É fundamental compreender que..." (direto na explicação)

⚠️ ÚNICA EXCEÇÃO: Slide tipo "introducao" da PRIMEIRA seção pode ter saudação.

## 🎓 LINGUAGEM ACESSÍVEL = EXPLICAR, NÃO CASUALIZAR

Linguagem acessível significa DESCOMPLICAR termos, NÃO usar gírias:

### Termos Jurídicos:
SEMPRE explique imediatamente após usar. Formato:
"O conceito de 'jurisdição' (poder do Estado de dizer o Direito) abrange..."

### Expressões em Latim:
SEMPRE traduza E contextualize. Formato:
"O princípio 'nemo iudex sine actore' (não há juiz sem autor) significa que o juiz não pode iniciar um processo por conta própria."

### Analogias (OBRIGATÓRIO para cada conceito abstrato):
"Pense na 'jurisdição' como o 'poder de decisão' do Estado - assim como um árbitro tem poder de decidir disputas no futebol, o Estado tem poder de decidir disputas jurídicas."
"O 'escopo jurídico' funciona como um GPS: guia as partes até a aplicação correta da lei."

### Hierarquia Progressiva:
1. Primeiro: Explique em palavras simples do cotidiano
2. Depois: Apresente o termo técnico entre aspas
3. Por fim: Aprofunde com visão doutrinária

## 🎨 VARIEDADE VISUAL (OBRIGATÓRIO!):

Intercale tipos de slides para manter dinamismo:
- A cada 2-3 slides "texto", insira um slide diferente:
  - "atencao": > ⚠️ **ATENÇÃO!** Ponto que CAI em prova...
  - "dica": > 💡 **DICA DE MEMORIZAÇÃO:** Para lembrar...
  - "caso": > 📚 **EXEMPLO PRÁTICO:** João ajuizou...
  - "termos": Glossário com 4-6 termos
  - "quickcheck": Pergunta de verificação

NUNCA gere 4+ slides "texto" consecutivos!

## 📖 PROFUNDIDADE:
- Mínimo 200-400 palavras por página tipo "texto"
- Sempre incluir: "> 📚 **EXEMPLO PRÁTICO:** ..."
- Sempre incluir cards visuais: "> ⚠️ **ATENÇÃO:**", "> 💡 **DICA:**"
- Cite juristas: "Conforme leciona 'Dinamarco'..."
- Blockquotes para citações legais: > "Art. X..."

**Matéria:** ${areaNome} - OAB 1ª Fase
**Tópico:** ${topicoTitulo}

═══ REFERÊNCIA DE ESTUDO ═══
${conteudoPDF || "Conteúdo não disponível"}
${conteudoResumo ? `\n═══ SUBTEMAS ═══\n${conteudoResumo}` : ""}
${contextoBase ? `\n═══ BASE OAB ═══\n${contextoBase}` : ""}
═══════════════════════`;
```

**Linhas 415-434 - Melhorar regex de limpeza:**

```typescript
const limparSaudacoesProibidas = (texto: string): string => {
  if (!texto) return texto;
  const saudacoesProibidas = [
    // Vocativos formais
    /^Futuro\s+colega,?\s*/gi,
    /^Prezad[oa]\s+(advogad[oa]|coleg[ao]|estudante)[^.]*,?\s*/gi,
    /^Car[oa]\s+(colega|estudante|futuro)[^.]*,?\s*/gi,
    /^Coleg[ao],?\s*/gi,
    // Saudações casuais
    /^E aí,?\s*(galera|futuro|colega|pessoal)?[!,.\s]*/gi,
    /^Olha só[!,.\s]*/gi,
    /^Olá[!,.\s]*/gi,
    /^Bem-vind[oa][!,.\s]*/gi,
    /^Vamos\s+(lá|juntos|estudar|mergulhar|nessa)?[!,.\s]*/gi,
    /^Bora\s+(lá|entender|ver|estudar)?[!,.\s]*/gi,
    /^Tá preparad[oa][?!.\s]*/gi,
    /^Beleza[?!,.\s]*/gi,
    /^Partiu[!,.\s]*/gi,
    /^(Cara|Mano),?\s*/gi,
  ];
  let resultado = texto;
  for (const regex of saudacoesProibidas) {
    resultado = resultado.replace(regex, '');
  }
  // Se o resultado começar com letra minúscula após limpeza, capitalize
  if (resultado.length > 0 && /^[a-z]/.test(resultado)) {
    resultado = resultado.charAt(0).toUpperCase() + resultado.slice(1);
  }
  return resultado.trim();
};
```

---

### Arquivo 2: `gerar-conteudo-resumo-oab/index.ts`

Aplicar as mesmas mudanças no `promptBase` (linhas 182-249) e na função `limparSaudacoesProibidas` (linhas 252-271).

---

### Arquivo 3: `gerar-slides-artigo/index.ts`

Aplicar as mesmas mudanças no `prompt` principal (linhas 174-248).

---

## Resultado Esperado

### Antes (problemático):

```markdown
DICA DE MEMORIZAÇÃO:
A Importância da Jurisdição no Ordenamento Jurídico

💡 DICA DE MEMORIZAÇÃO:

Futuro colega, para fixar os escopos da jurisdição, pense neles como os três pilares que sustentam a justiça em nossa sociedade:

• Pilar Jurídico: A aplicação da lei, como um mapa que nos guia para a solução correta.
```

### Depois (corrigido):

```markdown
DICA DE MEMORIZAÇÃO:
Escopos da Jurisdição - Os Três Pilares

💡 DICA DE MEMORIZAÇÃO:

Para fixar os três escopos da 'jurisdição' (poder do Estado de resolver conflitos), imagine-os como os três objetivos que o Estado busca quando você aciona a Justiça:

• **Escopo Jurídico**: A correta aplicação da lei ao caso concreto. Pense como um GPS que guia até a solução legal correta.

• **Escopo Social**: A pacificação dos conflitos. É o "apaziguador" - resolve a briga para que as partes sigam em paz.

• **Escopo Político**: A afirmação do poder estatal. O Estado mostra que tem autoridade para resolver disputas.

> ⚠️ **ATENÇÃO!** As bancas adoram perguntar qual escopo está relacionado com "pacificação social" (é o SOCIAL, não jurídico!).
```

---

## Sequencia de Implementacao

1. Atualizar `gerar-conteudo-oab-trilhas/index.ts` - promptBase e regex
2. Atualizar `gerar-conteudo-resumo-oab/index.ts` - promptBase e regex
3. Atualizar `gerar-slides-artigo/index.ts` - prompt principal
4. Deploy das 3 edge functions
5. Testar gerando novo conteúdo para verificar mudanças

