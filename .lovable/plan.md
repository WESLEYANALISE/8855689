

# Plano: Linguagem Mais Acessível na Geração de Conteúdo

## Objetivo

Tornar a linguagem gerada mais acessível e didática, garantindo que:

1. **Termos jurídicos** sejam explicados de forma clara e imediata
2. **Expressões em latim** sejam traduzidas e contextualizadas
3. **Analogias** sejam usadas para conectar conceitos abstratos ao dia a dia
4. **Parte técnica** seja respeitada, mas explicada de forma progressiva

---

## Estado Atual dos Prompts

| Arquivo | Status | Problema |
|---------|--------|----------|
| `gerar-conteudo-oab-trilhas` | Parcialmente acessível | Tem algumas instruções, mas não enfatiza analogias nem a explicação progressiva |
| `gerar-conteudo-resumo-oab` | Mais simplificado | Falta detalhamento sobre como explicar termos |
| `gerar-slides-artigo` | Mais completo | Já tem boas instruções, mas pode ser reforçado |

---

## Mudanças Propostas

### Nova Seção "LINGUAGEM ACESSÍVEL" para Todos os Prompts

Vou adicionar uma seção dedicada em cada prompt com instruções claras:

```text
## 🎓 LINGUAGEM ACESSÍVEL (TEACHER CHAT):

### Explicação de Termos Jurídicos:
- SEMPRE que usar um termo técnico, explique imediatamente após
- Formato: "O termo 'tipicidade' (que significa a adequação do fato à descrição legal)..."
- NUNCA assuma que o leitor conhece o termo

### Expressões em Latim:
- SEMPRE traduza E contextualize
- Formato: "O princípio 'in dubio pro reo' (na dúvida, a favor do réu) significa que..."
- Adicione: "Na prática, isso quer dizer que..."

### Analogias Obrigatórias:
- Use analogias do dia a dia para CADA conceito abstrato
- Exemplos:
  - "Pense na tipicidade como uma fechadura e a conduta como uma chave..."
  - "É como se o Direito criasse um 'molde' e a ação precisa 'encaixar'..."
  - "Imagine que a lei é um contrato de locação..."

### Explicação Progressiva (do simples ao complexo):
1. Primeiro: Apresente o conceito em linguagem cotidiana
2. Depois: Introduza o termo técnico correto
3. Por fim: Aprofunde com detalhes doutrinários

### Exemplos Práticos Imediatos:
- Após CADA conceito, dê um exemplo concreto
- Use nomes: João, Maria, Pedro, Ana, Carlos
- Situações reais: contrato de aluguel, briga de vizinhos, compra de carro
```

---

## Mudanças por Arquivo

### Arquivo 1: `supabase/functions/gerar-conteudo-oab-trilhas/index.ts`

**Localização**: Linha 325-381 (promptBase)

**Adicionar seção de linguagem acessível:**

```typescript
const promptBase = `Você é um professor de Direito didático e acolhedor...

## 🎓 LINGUAGEM ACESSÍVEL (TEACHER CHAT) - OBRIGATÓRIO:

### Como Explicar Termos Jurídicos:
Sempre que mencionar um termo técnico, EXPLIQUE IMEDIATAMENTE de forma clara.
Formato obrigatório: "O conceito de 'dolo eventual' (quando a pessoa assume o risco de produzir o resultado) significa que..."
NUNCA use um termo jurídico sem explicar o que ele significa.

### Como Traduzir Latim:
Expressões em latim DEVEM ser traduzidas E explicadas com contexto prático.
Exemplo: "O princípio 'nulla poena sine lege' (não há pena sem lei) significa, na prática, que ninguém pode ser punido se não existir uma lei anterior que defina o crime."

### Analogias e Metáforas (OBRIGATÓRIO):
Para CADA conceito abstrato, crie uma analogia com situações do dia a dia:
- "Pense na 'tipicidade' como uma peça de quebra-cabeça: a conduta precisa 'encaixar' perfeitamente no formato descrito pela lei."
- "A 'culpabilidade' funciona como um filtro: mesmo que alguém tenha feito algo errado, verificamos se era possível exigir outra atitude dele."
- "Imagine o 'nexo causal' como um fio que conecta a ação ao resultado - se o fio se rompe, não há crime."

### Explicação Progressiva (do simples ao complexo):
1. PRIMEIRO: Explique o conceito em palavras do cotidiano
2. DEPOIS: Apresente o termo técnico correto entre aspas
3. POR FIM: Aprofunde com a visão doutrinária

Exemplo de aplicação:
"Quando alguém age sabendo exatamente o que está fazendo e querendo o resultado, chamamos isso de 'dolo direto'. É como quando você joga uma pedra na janela do vizinho: você sabe que vai quebrar e quer quebrar. Diferente do 'dolo eventual', que seria jogar a pedra para cima sem olhar - você não quer quebrar a janela, mas aceita que pode acontecer. Conforme leciona 'Damásio de Jesus', o dolo eventual se caracteriza quando..."

### Exemplos Práticos com Nomes Reais:
Use SEMPRE nomes brasileiros comuns: João, Maria, Pedro, Ana, Carlos, Fernanda
Situações do cotidiano: contrato de aluguel, compra de carro, briga entre vizinhos, herança de família
`;
```

---

### Arquivo 2: `supabase/functions/gerar-conteudo-resumo-oab/index.ts`

**Localização**: Linha 182-222 (promptBase)

**Mesma seção de linguagem acessível**, adaptada para o contexto de resumos/subtemas.

---

### Arquivo 3: `supabase/functions/gerar-slides-artigo/index.ts`

**Localização**: Linha 174-380 (prompt principal)

**Reforçar as instruções existentes** com a mesma seção padronizada de linguagem acessível.

---

## Exemplo de Conteúdo Gerado (Antes vs Depois)

### Antes (Técnico Demais):

```markdown
O princípio da legalidade, previsto no Art. 5º, XXXIX da CF e Art. 1º do CP, 
estabelece que nullum crimen, nulla poena sine praevia lege. A tipicidade 
formal exige a subsunção do fato ao tipo penal, enquanto a material 
demanda a ofensividade ao bem jurídico tutelado.
```

### Depois (Acessível + Técnico):

```markdown
## O Que é o Princípio da Legalidade?

Imagine que você está jogando um jogo de tabuleiro. Você só pode ser 
penalizado se quebrar uma regra que já existia ANTES de você jogar, certo? 
O 'princípio da legalidade' funciona exatamente assim no Direito Penal.

Em latim, dizemos 'nullum crimen, nulla poena sine praevia lege' - que 
significa, em bom português: **"não há crime, nem pena, sem lei anterior"**.

📚 **EXEMPLO PRÁTICO:**
João inventou uma nova forma de golpe pela internet em 2024. Se não existir 
uma lei criada ANTES de 2024 que defina essa conduta como crime, João 
não pode ser punido - mesmo que todo mundo ache errado o que ele fez.

> "Art. 1º do CP: Não há crime sem lei anterior que o defina. 
> Não há pena sem prévia cominação legal."

Conforme leciona 'Rogério Greco', esse princípio é uma das maiores 
garantias do cidadão contra o arbítrio do Estado.

💡 **MACETE PARA OAB:** Se a questão mencionar "lei posterior mais 
benéfica", lembre que ela PODE retroagir. Mas lei nova que CRIA crime? 
Essa NUNCA retroage!
```

---

## Resumo das Mudanças

| Arquivo | Mudança | Linhas |
|---------|---------|--------|
| `gerar-conteudo-oab-trilhas/index.ts` | Adicionar seção "LINGUAGEM ACESSÍVEL" no promptBase | ~325-381 |
| `gerar-conteudo-resumo-oab/index.ts` | Adicionar mesma seção no promptBase | ~182-222 |
| `gerar-slides-artigo/index.ts` | Reforçar seção existente com padrão unificado | ~174-215 |

---

## Sequência de Implementação

1. Atualizar `gerar-conteudo-oab-trilhas/index.ts` com nova seção
2. Atualizar `gerar-conteudo-resumo-oab/index.ts` com mesma seção
3. Atualizar `gerar-slides-artigo/index.ts` para reforçar padrão
4. Deploy das 3 edge functions
5. Testar gerando um novo conteúdo

