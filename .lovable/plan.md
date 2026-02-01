
# Plano: Corrigir Progresso e Capa dos Subtemas OAB

## Resumo dos Problemas Identificados

### Problema 1: Progresso de 25% Incorreto
O sistema está buscando/salvando progresso com `topico_id` (468) quando deveria usar `resumo_id` (6946). A tabela `oab_trilhas_estudo_progresso` armazena progresso por subtema (resumo), não por tópico pai.

### Problema 2: Capa Não Gerada
A edge function `gerar-capa-subtema-resumo` não foi redeployada após a correção do modelo. A versão em produção ainda usa o SDK `@google/generative-ai` com modelo inexistente `gemini-2.5-flash-preview-05-20`.

---

## Correções Necessárias

### 1. Corrigir Query de Progresso no Frontend

**Arquivo:** `src/pages/oab/OABTrilhasSubtemaEstudo.tsx`

**Mudança:** Substituir `topico_id` por `resumo_id` nas queries e mutations de progresso:

```typescript
// ANTES (errado):
const { data: progresso } = useQuery({
  queryKey: ["oab-subtema-progresso", parsedTopicoId, user?.id],
  queryFn: async () => {
    ...
    .eq("topico_id", parsedTopicoId)  // ❌ Errado
  },
});

// DEPOIS (correto):
const { data: progresso } = useQuery({
  queryKey: ["oab-subtema-progresso", parsedResumoId, user?.id],  
  queryFn: async () => {
    ...
    .eq("topico_id", parsedResumoId)  // ✅ Usar resumo_id
  },
});
```

**Também corrigir em:**
- `handleSlidesComplete()` - linha 336-349
- `handleProgressChange()` - linha 355-367

---

### 2. Redeploy da Edge Function de Capa

A edge function `gerar-capa-subtema-resumo` precisa ser redeployada para usar a versão corrigida que:
- Usa fetch direto (não SDK)
- Usa modelo `gemini-2.5-flash-image`
- Usa rotação de 3 chaves Gemini
- Comprime para WebP 1280x720 via TinyPNG

---

## Resultado Esperado

Após as correções:
1. **Progresso**: Cada subtema (resumo) terá seu progresso individual, iniciando em 0%
2. **Capa**: Será gerada com o modelo correto `gemini-2.5-flash-image` igual aos Conceitos

---

## Seção Técnica

### Estrutura de IDs na Rota

A rota `/oab/trilhas-aprovacao/materia/{materiaId}/topicos/{topicoId}/estudo/{resumoId}` tem:
- `materiaId` (3) - ID da matéria OAB
- `topicoId` (468) - ID do tópico (agrupador)
- `resumoId` (6946) - ID do subtema específico (usado para progresso)

### Logs Confirmando o Problema da Capa

```text
[Capa Subtema] Tentando chave 1 com gemini-2.5-flash-preview-05-20...
models/gemini-2.5-flash-preview-05-20 is not found for API version v1beta
```

A função deployada ainda usa o modelo antigo inexistente.

### Comparação de Modelos

| Função | Modelo Atual (Deploy) | Modelo Correto |
|--------|----------------------|----------------|
| `gerar-capa-subtema-resumo` | `gemini-2.5-flash-preview-05-20` | `gemini-2.5-flash-image` |
| `gerar-capa-topico-conceitos` | `gemini-2.5-flash-image` | `gemini-2.5-flash-image` |
