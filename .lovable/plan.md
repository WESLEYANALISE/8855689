

# Plano: Alinhar Tom do OAB Trilhas com o Estilo Descontraído de Conceitos

## Resumo

Atualmente, o prompt do **OAB Trilhas** tem um tom muito estruturado e técnico, com muitas regras rígidas. O objetivo é torná-lo igual ao de **Conceitos**, que é mais leve - como um "professor descontraído conversando com um amigo tomando um café".

---

## Mudanças Propostas

### 1. Simplificar o Prompt Base do OAB Trilhas

Trocar o prompt atual extenso (115+ linhas de regras rígidas) por um prompt mais natural e amigável, no estilo de Conceitos:

**ANTES (OAB Trilhas):**
```
Você é um professor de Direito experiente, mas que sabe EXPLICAR DE FORMA SIMPLES.
Seu público são candidatos à OAB, mas você deve escrever como se estivesse explicando 
para uma pessoa de 16 anos.

## 🎯 REGRA FUNDAMENTAL DE ESCRITA (CRÍTICO!)
Imagine que está explicando para seu IRMÃO MAIS NOVO de 16 anos...
(+ 100 linhas de regras detalhadas)
```

**DEPOIS (estilo Conceitos):**
```
Você é um professor de Direito descontraído, didático e apaixonado por ensinar.
Seu estilo é como uma CONVERSA COM UM AMIGO - você explica os conceitos como 
se estivesse tomando um café.

## 🎯 ESTILO DE ESCRITA:
- Escreva como CONVERSA, use expressões como "Olha só...", "Percebeu?", "Veja bem..."
- Perguntas retóricas para engajar: "E por que isso é tão importante?"
- Analogias com situações do dia a dia
- Explique TODO termo técnico ou em latim com linguagem simples
- Exemplos práticos imediatos com nomes comuns (João, Maria, Ana)
```

### 2. Manter Regras Essenciais (de forma compacta)

Algumas regras do OAB são importantes e serão mantidas de forma resumida:

- **Tradução de latim**: manter, mas de forma mais natural
- **Variedade visual**: manter intercalação de tipos de slides
- **Profundidade mínima**: 200-400 palavras por slide de texto
- **Sem saudações excessivas**: manter, mas menos rígido

### 3. Remover Regras Excessivamente Rígidas

Excluir do prompt:
- Lista extensa de "O QUE NUNCA FAZER" (❌)
- Regras muito detalhadas sobre formatação
- Tom de "proibição" e "obrigatório"
- Exemplos de ERRADO vs CERTO (deixar mais natural)

---

## Arquivo a Editar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/gerar-conteudo-oab-trilhas/index.ts` | Substituir `promptBase` (linhas 325-437) pelo estilo de Conceitos |

---

## Resultado Esperado

O conteúdo gerado para OAB Trilhas terá o mesmo tom amigável e descontraído das Trilhas de Conceitos:
- Professor apaixonado por ensinar
- Conversa informal, como um café com amigo
- Expressões naturais: "Olha só...", "Percebeu?", "Veja bem..."
- Menos regras rígidas, mais fluidez

