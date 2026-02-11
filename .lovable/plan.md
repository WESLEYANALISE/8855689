
# Teste do Facebook Pixel + Correção de Build

## O que será feito

### 1. Adicionar `test_event_code` na Edge Function
O Facebook exige que o `test_event_code: TEST30748` seja incluído no payload enviado à API de Conversões para validar que o servidor está funcionando. Vou adicionar suporte a esse código na edge function.

- **Arquivo:** `supabase/functions/facebook-conversions/index.ts`
- Aceitar campo opcional `test_event_code` no body da requisição
- Incluir no payload enviado ao Facebook: `{ data: [...], test_event_code: "TEST30748" }`

### 2. Enviar `test_event_code` pelo hook do frontend
- **Arquivo:** `src/hooks/useFacebookPixel.ts`
- Adicionar parâmetro opcional `test_event_code` no `trackEvent`
- Passar para a edge function quando presente

### 3. Corrigir warning de build (import dinâmico vs estático)
- **Arquivo:** `src/pages/Auth.tsx`
- O `useFacebookPixel` está sendo importado dinamicamente (`await import(...)`) em Auth.tsx, mas estaticamente nos outros arquivos, gerando um warning do Vite
- Solução: mudar para chamada direta da edge function via `supabase.functions.invoke()` sem importar o hook (já que está fora de um componente React, dentro de um callback)

### 4. Disparar evento de teste
- Após deploy, vou chamar a edge function diretamente com o `test_event_code: TEST30748` para validar a conexão com o Facebook

## Detalhes Técnicos

**Edge Function - mudança no payload:**
```typescript
// Aceitar test_event_code do body
const { event_name, event_id, ..., test_event_code } = await req.json();

// Incluir no payload se presente
const eventData = {
  data: [...],
  ...(test_event_code && { test_event_code }),
};
```

**Auth.tsx - remover import dinâmico, usar supabase diretamente:**
Já está fazendo `supabase.functions.invoke('facebook-conversions', ...)` diretamente, então basta remover o `await import('@/hooks/useFacebookPixel')` que não está sendo usado de fato.
