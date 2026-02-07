
# Plano: Otimizar Chat da Professora para Respostas Instantâneas

## Problema Identificado

Analisando os logs e o código, identifiquei os seguintes problemas:

1. **Latência alta (6-14 segundos para primeira resposta)**: O Gemini API está demorando entre 10-17 segundos para enviar o primeiro chunk devido a:
   - Prompt muito extenso exigindo respostas de 31.000-40.500 caracteres
   - Busca no banco de dados antes de chamar a API (busca contexto, FAQs, resumos)
   - Sistema de fallback de múltiplas chaves API

2. **Texto pequeno durante streaming**: O código usa `text-[13px]` durante streaming (linha 834) e `text-[15px]` após concluir (linha 779), causando mudança de tamanho

3. **Respostas muito longas**: A configuração atual exige mínimo de 5.164 palavras no modo "complete" - muito extenso para uma conversa natural

## Solução Proposta

### 1. Criar Novo Nível de Resposta: "concise" (Respostas Curtas)

Adicionar um nível de resposta padrão para o chat que gera respostas de 400-800 palavras (cerca de 2.500-5.000 caracteres), mantendo qualidade mas reduzindo latência.

**Arquivo**: `supabase/functions/chat-professora/prompt-templates.ts`
```typescript
concise: {
  palavras: [400, 800],
  caracteres: [2500, 5000],
  tokens: 1500
}
```

### 2. Otimizar Prompt para Respostas Mais Rápidas

**Arquivo**: `supabase/functions/chat-professora/index.ts`

- Reduzir o prompt de sistema para o modo de chat padrão (menos instruções = resposta mais rápida)
- Usar nível "concise" como padrão no chat
- Manter "deep" apenas quando usuário clica em "Aprofundar"
- Remover a obrigatoriedade de quadros comparativos e componentes visuais em respostas curtas

### 3. Corrigir Tamanho de Fonte Durante Streaming

**Arquivo**: `src/components/chat/ChatMessageNew.tsx`

Unificar o tamanho de texto para `text-[15px]` tanto durante quanto após o streaming, eliminando a mudança de tamanho.

### 4. Usar Modelo Mais Rápido para Chat Interativo

**Arquivo**: `supabase/functions/chat-professora/index.ts`

- Usar `gemini-2.0-flash` para respostas rápidas (latência ~2-3 segundos)
- Manter `gemini-2.5-flash` apenas para modo "deep" ou geração de aulas

### 5. Paralelizar Buscas no Banco

Executar buscas de contexto em paralelo com Promise.all() para reduzir tempo de setup.

---

## Detalhes Técnicos

### Mudanças no Edge Function (`chat-professora/index.ts`)

```typescript
// ANTES: responseLevel default era 'complete' com 5000+ palavras
// DEPOIS: responseLevel default será 'concise' com 400-800 palavras

// Escolher modelo baseado no nível
const modelName = responseLevel === 'deep' 
  ? 'gemini-2.5-flash'  // Mais poderoso para análises profundas
  : 'gemini-2.0-flash'; // Mais rápido para respostas curtas

// Prompt simplificado para modo concise
if (responseLevel === 'concise') {
  systemPrompt = `Você é a Professora Jurídica.

REGRAS:
- Respostas entre 400-800 palavras
- Vá direto ao ponto
- Use **negrito** para termos importantes
- Cite artigos relevantes
- Finalize com: "Quer que eu aprofunde?"

NUNCA: respostas longas ou truncadas.`;
}
```

### Mudanças no Frontend

**`useStreamingChat.ts`**:
```typescript
// Usar 'concise' como padrão
responseLevel: options.responseLevel || 'concise'
```

**`ChatMessageNew.tsx`**:
```tsx
// ANTES: text-[13px] durante streaming, text-[15px] após
// DEPOIS: text-[15px] em ambos os casos

<div className="text-[15px] leading-[1.7] text-foreground/90">
  {content ? (
    isStreaming ? (
      <div className="streaming-markdown prose prose-sm dark:prose-invert max-w-none">
```

---

## Resultado Esperado

| Métrica | Antes | Depois |
|---------|-------|--------|
| Tempo até primeira letra | 6-14 segundos | 1-3 segundos |
| Tamanho da resposta | 5.000+ palavras | 400-800 palavras |
| Mudança de fonte durante streaming | Sim (13px → 15px) | Não (15px fixo) |
| Experiência do usuário | Espera longa | Resposta quase instantânea |

---

## Arquivos a Modificar

1. **`supabase/functions/chat-professora/prompt-templates.ts`** - Adicionar nível "concise"
2. **`supabase/functions/chat-professora/index.ts`** - Simplificar prompt padrão, usar modelo mais rápido
3. **`src/hooks/useStreamingChat.ts`** - Usar "concise" como padrão
4. **`src/components/chat/ChatMessageNew.tsx`** - Corrigir tamanho de fonte durante streaming
5. **`src/pages/ChatProfessora.tsx`** - Atualizar configuração de responseLevel
