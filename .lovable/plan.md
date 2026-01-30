
# Plano: Melhorias no Chat da Professora

## Objetivo
1. Simplificar menu de alternância para apenas 3 opções com tamanhos iguais
2. Aumentar a quantidade de tokens nas respostas
3. Adicionar quadros comparativos obrigatórios nas respostas
4. Evitar truncamento de respostas

---

## 1. Menu de Alternância (3 opções iguais)

### Arquivo: `src/pages/ChatProfessora.tsx`

**Mudanças:**
- Manter apenas 3 modos: `study`, `realcase`, `aula`
- Usar `flex-1` para distribuir espaço igualmente
- Remover scroll horizontal

**Antes:**
```typescript
const MODES = [
  { id: "study", label: "Estudar", icon: BookOpen },
  { id: "realcase", label: "Caso Real", icon: Scale },
  { id: "aula", label: "Criar Aula", icon: GraduationCap },
  { id: "recommendation", label: "Indicações", icon: Lightbulb },
  { id: "tcc", label: "TCC", icon: MessageCircle },
];
```

**Depois:**
```typescript
const MODES = [
  { id: "study", label: "Estudar", icon: BookOpen },
  { id: "realcase", label: "Caso Real", icon: Scale },
  { id: "aula", label: "Criar Aula", icon: GraduationCap },
];
```

**CSS dos botões:**
- Adicionar `flex-1` para cada botão ter o mesmo tamanho
- Container com `flex w-full` para ocupar toda a largura

---

## 2. Aumentar Tokens nas Respostas

### Arquivo: `supabase/functions/chat-professora/index.ts`

**Mudanças no `generationConfig`:**

| Parâmetro | Valor Atual | Novo Valor |
|-----------|-------------|------------|
| `maxOutputTokens` | 8192 | 16384 |

**Linha 512:**
```typescript
// ANTES
maxOutputTokens: mode === 'aula' ? 32000 : 8192

// DEPOIS
maxOutputTokens: mode === 'aula' ? 32000 : 16384
```

---

## 3. Quadro Comparativo Obrigatório

### Arquivo: `supabase/functions/chat-professora/index.ts`

**Adicionar instrução no system prompt (modo study/default):**

```text
📊 QUADRO COMPARATIVO OBRIGATÓRIO:
Em TODA resposta elaborada (mais de 400 palavras), inclua OBRIGATORIAMENTE 
um quadro comparativo usando o formato:

[COMPARAÇÃO: Título Descritivo]
| Aspecto | Conceito A | Conceito B |
|---------|------------|------------|
| Definição | ... | ... |
| Características | ... | ... |
| Aplicação | ... | ... |
| Exemplo | ... | ... |
[/COMPARAÇÃO]

Use este quadro para contrastar conceitos relacionados, 
antes vs depois, teoria vs prática, etc.
```

---

## 4. Evitar Truncamento de Respostas

### Arquivo: `supabase/functions/chat-professora/index.ts`

**Adicionar instrução no prompt:**

```text
⚠️ REGRA CRÍTICA - NUNCA TRUNCAR:
- SEMPRE complete suas respostas integralmente
- Se a resposta for longa, organize em seções claras
- NUNCA termine uma resposta no meio de uma frase ou ideia
- Caso o conteúdo seja extenso, priorize completar a explicação 
  principal antes de adicionar exemplos extras
- Finalize SEMPRE com uma conclusão ou pergunta de fechamento
```

---

## Arquivos a Modificar

| Arquivo | Mudanças |
|---------|----------|
| `src/pages/ChatProfessora.tsx` | Reduzir para 3 modos, botões com tamanho igual |
| `supabase/functions/chat-professora/index.ts` | Aumentar tokens, adicionar quadro comparativo, regra anti-truncamento |

---

## Resumo Visual das Mudanças

### Menu Atual (5 opções, scroll):
```text
[Estudar] [Caso Real] [Criar Aula] [Indicações] [TCC]
```

### Menu Novo (3 opções, tamanhos iguais):
```text
[   Estudar   ] [  Caso Real  ] [  Criar Aula  ]
```

### Resposta da Professora:
- Mínimo 800+ palavras em respostas elaboradas
- Quadro comparativo obrigatório em toda resposta elaborada
- Respostas sempre completas, nunca truncadas
