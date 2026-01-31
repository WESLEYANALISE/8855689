
# Plano: Corrigir Bug de Scroll + Estilização de Citações

## Problema 1: Mensagens Desaparecem ao Scrollar

### Diagnóstico
O bug ocorre por duas razões:

1. **Keys instáveis nas mensagens**: A key `msg-${index}-${message.role}-${message.content?.length || 0}` muda toda vez que o conteúdo é atualizado durante streaming, causando remontagem do componente
2. **ScrollArea do Radix**: O componente pode ter problemas de renderização em certas condições

### Solução

**Arquivo: `src/pages/ChatProfessora.tsx`**

- Usar IDs únicos estáveis para cada mensagem (baseado em timestamp/UUID)
- Remover dependência do `content.length` na key
- Adicionar `id` único no hook `useStreamingChat`

**Arquivo: `src/hooks/useStreamingChat.ts`**

- Adicionar campo `id` único a cada mensagem usando `crypto.randomUUID()`
- Garantir que o ID persiste durante todo o ciclo de vida da mensagem

```typescript
// Exemplo de ID estável
export interface ChatMessage {
  id: string; // NOVO: ID único persistente
  role: "user" | "assistant";
  content: string;
  termos?: TermoJuridico[];
  isStreaming?: boolean;
}

// Ao criar mensagem
const userMsg: ChatMessage = { 
  id: crypto.randomUUID(), // ID único
  role: "user", 
  content: userMessage 
};
```

---

## Problema 2: Estilização de Citações e Exemplos

### Solução

**Arquivo: `src/components/chat/ChatMessageNew.tsx`**

Adicionar detecção automática e estilização para:

1. **Citações de Artigos** (Art. X, § Y, inciso Z):
   - Fundo âmbar/dourado com borda lateral
   - Ícone de livro ou lei

2. **Exemplos Práticos** (blocos que começam com "Exemplo:", "Ex:", "💡"):
   - Fundo azul/roxo suave
   - Borda arredondada diferenciada

3. **Blockquotes** (citações genéricas):
   - Fundo cinza com borda lateral

```tsx
// Componente de citação legal
const CitacaoLegal = ({ children }) => (
  <div className="my-4 p-4 bg-amber-500/10 border-l-4 border-amber-500 rounded-r-lg">
    <div className="flex items-start gap-2">
      <Scale className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
      <div className="text-amber-100">{children}</div>
    </div>
  </div>
);

// Componente de exemplo prático
const ExemploPratico = ({ children }) => (
  <div className="my-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
    <div className="flex items-start gap-2">
      <Lightbulb className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
      <div className="text-purple-100">{children}</div>
    </div>
  </div>
);
```

---

## Problema 3: Build Error

**Arquivo: `src/components/oab/QuadroComparativoVisual.tsx`**

Adicionar import do React no início do arquivo:
```typescript
import React, { useRef, useState, useCallback } from "react";
```

---

## Arquivos a Modificar

1. `src/hooks/useStreamingChat.ts` - Adicionar ID único às mensagens
2. `src/pages/ChatProfessora.tsx` - Usar ID estável como key
3. `src/components/chat/ChatMessageNew.tsx` - Adicionar estilos para citações e exemplos
4. `src/components/oab/QuadroComparativoVisual.tsx` - Corrigir import do React

---

## Resultado Esperado

- Mensagens não desaparecem mais ao scrollar para cima/baixo
- Citações de artigos de lei aparecem com fundo âmbar destacado
- Exemplos práticos aparecem com fundo roxo/azul diferenciado
- Build compila sem erros
