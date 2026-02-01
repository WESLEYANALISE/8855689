
# Plano: Unificar Subtema OAB (RESUMO) 100% Igual aos Conceitos

## Visão Geral

Tornar a experiência de estudo dos Subtemas OAB (tabela `RESUMO`) idêntica à dos Conceitos, com:
- 35-55 slides em 5-7 seções estruturadas
- 10 tipos de slide (termos, quickcheck, tabela, linha_tempo, etc.)
- Geração de capas via Gemini + TinyPNG 1280x720 (mesmo modelo dos Conceitos)
- Nova coluna `slides_json` na tabela RESUMO

---

## Mudanças Necessárias

### 1. Migração SQL (nova coluna)

Adicionar coluna `slides_json` na tabela `RESUMO`:

```sql
ALTER TABLE public."RESUMO" 
ADD COLUMN IF NOT EXISTS slides_json JSONB;
```

---

### 2. Edge Function de Geração de Conteúdo

**Arquivo:** `supabase/functions/gerar-conteudo-resumo-oab/index.ts`

**Mudança:** Reescrever para usar o mesmo fluxo incremental de `gerar-conteudo-conceitos`:

**Fluxo Novo (igual Conceitos):**
1. **ETAPA 1:** Gerar estrutura/esqueleto (5-7 seções, 35-55 páginas planejadas)
2. **ETAPA 2:** Gerar conteúdo por seção (batch incremental com retry)
3. **ETAPA 3:** Gerar extras (correspondências, flashcards, questões)
4. **ETAPA 4:** Montar `slidesData` e salvar em `slides_json` + `conteudo_gerado`
5. **ETAPA 5:** Disparar geração de capa

**Tipos de slide a gerar:**
- introducao, texto, termos, linha_tempo, tabela
- atencao, dica, caso, resumo, quickcheck

**Validação:** Mínimo 20 páginas (igual Conceitos)

---

### 3. Edge Function de Geração de Capa

**Arquivo:** `supabase/functions/gerar-capa-subtema-resumo/index.ts`

**Mudanças:**
- Trocar modelo `gemini-2.0-flash-exp-image-generation` para `gemini-2.5-flash-image` (mesmo dos Conceitos)
- Garantir resize para 1280x720 (cover) no TinyPNG

---

### 4. Frontend (Leitura)

**Arquivo:** `src/pages/oab/OABTrilhasSubtemaEstudo.tsx`

**Mudanças:**
1. Query já busca `*`, então `slides_json` virá automaticamente
2. No `useMemo` de `slidesData`, adicionar prioridade para `resumo.slides_json`:

```typescript
const slidesData = useMemo(() => {
  // 1. PRIORIDADE: slides_json na raiz do resumo
  if (resumo?.slides_json) {
    const data = resumo.slides_json as any;
    if (data?.secoes && Array.isArray(data.secoes) && data.secoes.length > 0) {
      return data.secoes.map(secao => ({...}));
    }
  }
  
  // 2. Fallback: conteudo_gerado.secoes
  // 3. Fallback antigo: conteudo_gerado.paginas
}, [resumo?.slides_json, conteudoGerado]);
```

3. Usar objetivos de `resumo.slides_json.objetivos` se disponível

---

## Estrutura do slides_json

```text
{
  "versao": 1,
  "titulo": "Nome do Subtema",
  "tempoEstimado": "25 min",
  "objetivos": ["Objetivo 1", "Objetivo 2", "Objetivo 3"],
  "secoes": [
    {
      "id": 1,
      "titulo": "Nome da Seção",
      "slides": [
        { "tipo": "introducao", "titulo": "...", "conteudo": "..." },
        { "tipo": "texto", "titulo": "...", "conteudo": "..." },
        { "tipo": "termos", "titulo": "...", "conteudo": "...", "termos": [...] },
        { "tipo": "quickcheck", "titulo": "...", "pergunta": "...", ... }
      ]
    }
  ]
}
```

---

## Compatibilidade

- **Conteúdos antigos:** Continuam funcionando via fallback `conteudo_gerado.paginas`
- **Novos conteúdos:** Terão `slides_json` preenchido
- **Transição suave:** O frontend lê `slides_json` primeiro, se não existir usa `conteudo_gerado`

---

## Resultado Final

Após implementação:
- Subtema OAB terá 35-55 páginas (igual Conceitos)
- Mesmos tipos de slide interativos
- Mesma qualidade de capas (Gemini 2.5-flash-image + TinyPNG 1280x720)
- Mesmo viewer, footer e sistema de progresso

---

## Seção Técnica - Detalhes de Implementação

### Prompt de Estrutura (cópia do Conceitos)

```text
Gere entre 5-7 seções
Cada seção deve ter 6-10 páginas (total final: 35-55 páginas)
TIPOS DISPONÍVEIS: introducao, texto, termos, linha_tempo, tabela, atencao, dica, caso, resumo, quickcheck
Distribua bem os tipos (não só "texto")
Cada seção deve ter pelo menos 1 quickcheck
```

### Modelo Gemini para Imagem

```text
Modelo atual (RESUMO): gemini-2.0-flash-exp-image-generation
Modelo correto (Conceitos): gemini-2.5-flash-image
```

### TinyPNG Resize

```text
Configuração: { method: "cover", width: 1280, height: 720 }
Output: image/webp
```

### Validação de Páginas

```text
Mínimo: 20 páginas
Ideal: 35-55 páginas
Cada seção: pelo menos 3 slides
```
