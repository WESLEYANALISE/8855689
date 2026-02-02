
# Plano: Otimizar Geração de Imagens das Trilhas OAB para Custo Zero

## Resumo Executivo
Migrar a geração de imagens dos tópicos OAB para usar configurações otimizadas de custo, aproveitando o **Free Tier do Google Gemini** com prompt simplificado e resolução reduzida.

## Situacao Atual

### Modelo Utilizado
- **Modelo**: `gemini-2.0-flash-exp-image-generation`
- **Custo**: Free Tier (gratuito)
- **Problema**: O prompt atual e excessivamente detalhado, consumindo mais tokens de entrada

### Prompt Atual (172 palavras - muito longo)
```
Generate a CINEMATIC 16:9 horizontal illustration with EDGE-TO-EDGE composition...
Dark rich background covering the entire frame in deep navy and burgundy tones...
Brazilian legal education scene with subtle scales of justice...
Ultra high resolution, photorealistic quality.
```

### Comparativo de Modelos Google
| Modelo | Free Tier | Pago |
|--------|-----------|------|
| `gemini-2.0-flash-exp` | Gratuito | - |
| `gemini-2.5-flash-image` | Gratuito | $0.30/1M tokens |
| `gemini-2.5-flash-lite` | Gratuito (mais rapido) | $0.10/1M tokens |

---

## Plano de Otimizacao

### 1. Simplificar o Prompt (reducao de 70%)

**De 172 palavras para aproximadamente 50 palavras:**

```text
16:9 dark cinematic illustration, Brazilian law theme about "{area}".
Abstract geometric patterns with scales of justice.
Deep navy and burgundy tones, dramatic lighting.
No text, no faces, minimal style.
```

**Beneficios:**
- Menos tokens de entrada = processamento mais rapido
- Rate limit menos provavel de ser atingido
- Resultado visual consistente

### 2. Reduzir Resolucao de Saida (opcional via TinyPNG)

Atualmente: 1280x720 (HD)
Proposta: Manter 1280x720 pois ja e economico

**Alternativa ultra-economica**: 854x480 (SD) - 56% menos pixels
- Suficiente para thumbnails de 80x80px na UI
- Reducao significativa no tamanho do arquivo

### 3. Adicionar Multi-Modelo com Fallback Inteligente

Ordem de tentativa (do mais rapido/barato ao mais robusto):
1. `gemini-2.5-flash-lite` (mais leve)
2. `gemini-2.0-flash-exp-image-generation` (atual)
3. `gemini-2.5-flash-image` (alternativo)

### 4. Sistema de Cache Mais Agressivo

- Verificar se outro topico da mesma **materia** ja tem capa
- Reutilizar a capa da materia para todos os topicos relacionados
- Reduz geracao de imagens em ate 90%

---

## Alteracoes Tecnicas

### Arquivo: `supabase/functions/gerar-capa-topico-oab/index.ts`

**Mudancas principais:**

1. **Novo prompt simplificado:**
```typescript
const imagePrompt = `16:9 dark cinematic illustration, Brazilian law theme about "${area}".
Abstract geometric patterns with scales of justice.
Deep navy and burgundy, dramatic lighting.
No text, no faces, minimal style.`;
```

2. **Multi-modelo com fallback:**
```typescript
const MODELOS_IMAGEM = [
  'gemini-2.5-flash-lite',          // Mais barato/rapido
  'gemini-2.0-flash-exp-image-generation', // Atual
  'gemini-2.5-flash-image'          // Alternativo
];
```

3. **Reutilizacao de capa entre topicos da mesma materia:**
```typescript
// Verificar se outro topico da mesma materia ja tem capa
const { data: siblingWithCover } = await supabase
  .from("oab_trilhas_topicos")
  .select("capa_url, materia_id")
  .eq("materia_id", materiaId)
  .not("capa_url", "is", null)
  .limit(1)
  .single();

if (siblingWithCover?.capa_url) {
  // Reutilizar capa existente
  await supabase.from("oab_trilhas_topicos")
    .update({ capa_url: siblingWithCover.capa_url })
    .eq("id", topico_id);
  return { success: true, cached: true };
}
```

4. **Compressao WebP via TinyPNG (ja implementado):**
- Reducao media de 60-80% no tamanho
- Formato WebP mais eficiente

---

## Estimativa de Economia

| Item | Antes | Depois |
|------|-------|--------|
| Tokens por prompt | ~250 | ~70 |
| Modelo | Flash exp | Flash Lite (mais leve) |
| Imagens geradas | 1 por topico | 1 por materia (reutilizada) |
| Custo total | R$ 0 (Free Tier) | R$ 0 (Free Tier + menos uso) |

**Beneficio real**: Menos rate limiting, geracao mais rapida, menos falhas

---

## Arquivos a Modificar

1. `supabase/functions/gerar-capa-topico-oab/index.ts`
   - Prompt simplificado
   - Multi-modelo com fallback
   - Sistema de cache por materia
   - Logs otimizados

---

## Resultado Esperado

- Geracao de imagens 2-3x mais rapida
- Menos erros de rate limiting (429)
- Mesmo custo: R$ 0 (Free Tier)
- Imagens consistentes com estilo minimalista
- Reducao de 90% nas chamadas de API (reutilizacao)
