
# Plano: Unificar OAB Trilhas Subtema (RESUMO) 100% Igual aos Conceitos

## Objetivo

Fazer a experiência de estudo dos **Subtemas OAB** (tabela `RESUMO`) ser **idêntica** à dos Conceitos:
- Formato de conteúdo com 35-55 slides em seções estruturadas
- Geração de capas via Gemini + TinyPNG (igual `gerar-capa-topico-conceitos`)
- Nova coluna `slides_json` na tabela `RESUMO`
- Tipos de página variados (termos, quickcheck, tabela, etc.)

---

## Diferenças Atuais Identificadas

| Aspecto | Conceitos | OAB Subtema (RESUMO) - Atual |
|---------|-----------|------------------------------|
| **Armazenamento** | `slides_json` (JSONB estruturado) | `conteudo_gerado.paginas` (flat) |
| **Quantidade páginas** | 35-55 em 5-7 seções | 6-8 páginas flat |
| **Tipos de slide** | introducao, texto, termos, linha_tempo, tabela, atencao, dica, caso, resumo, quickcheck | Apenas introducao, texto, quadro_comparativo, dicas_provas, sintese_final |
| **Geração de capa** | Gemini + TinyPNG + WebP 1280x720 (`gerar-capa-topico-conceitos`) | Gemini + TinyPNG (`gerar-capa-subtema-resumo`) - similar mas bucket diferente |
| **Bucket storage** | `gerador-imagens` | `gerador-imagens/capas-resumo` - OK |

---

## Etapa 1: Schema (Migração SQL)

Adicionar coluna `slides_json` na tabela `RESUMO`:

```sql
ALTER TABLE public."RESUMO" 
ADD COLUMN IF NOT EXISTS slides_json JSONB;

COMMENT ON COLUMN public."RESUMO".slides_json IS 
'Conteúdo estruturado em seções/slides (formato igual conceitos_topicos.slides_json)';
```

---

## Etapa 2: Atualizar Edge Function de Geração de Conteúdo

**Arquivo:** `supabase/functions/gerar-conteudo-resumo-oab/index.ts`

Mudanças principais:

1. **Usar estrutura igual Conceitos** - Gerar esqueleto primeiro, depois preencher seção por seção
2. **35-55 slides** em 5-7 seções
3. **Tipos variados** (termos, quickcheck, tabela, linha_tempo, caso, dica, atencao, resumo)
4. **Salvar em `slides_json`** além de manter compatibilidade com `conteudo_gerado.paginas`

Novo fluxo:
```text
1. ETAPA 1: Gerar estrutura/esqueleto (5-7 seções, 35-55 páginas planejadas)
2. ETAPA 2: Gerar conteúdo por seção (batch incremental)
3. ETAPA 3: Gerar extras (correspondências, flashcards, questões)
4. ETAPA 4: Montar slidesData e salvar em slides_json
5. ETAPA 5: Disparar geração de capa (igual Conceitos)
```

Validação mínima: **20 páginas** (igual Conceitos).

---

## Etapa 3: Atualizar Edge Function de Geração de Capa

**Arquivo:** `supabase/functions/gerar-capa-subtema-resumo/index.ts`

Unificar com o método de `gerar-capa-topico-conceitos`:
- Usar função `gerarImagemComGemini` com fallback de chaves e modelo `gemini-2.5-flash-image`
- Comprimir via TinyPNG para WebP 1280x720
- Upload para bucket `gerador-imagens` (caminho já OK: `capas-resumo/`)

Mudanças:
- Trocar API de `gemini-2.0-flash-exp-image-generation` para `gemini-2.5-flash-image`
- Adicionar resize para 1280x720 (cover)

---

## Etapa 4: Atualizar Frontend para Ler slides_json

**Arquivo:** `src/pages/oab/OABTrilhasSubtemaEstudo.tsx`

Mudanças:

1. **Priorizar `slides_json`** sobre `conteudo_gerado.paginas`:
```typescript
const slidesData = useMemo(() => {
  // 1. Novo formato: slides_json na raiz do resumo
  if (resumo?.slides_json) {
    const data = resumo.slides_json as any;
    if (data?.secoes && Array.isArray(data.secoes)) {
      return {
        secoes: data.secoes,
        objetivos: data.objetivos || [],
        tempoEstimado: data.tempoEstimado || "25 min"
      };
    }
  }
  
  // 2. Fallback: conteudo_gerado.secoes
  if (conteudoGerado.secoes && Array.isArray(conteudoGerado.secoes)) { ... }
  
  // 3. Fallback antigo: conteudo_gerado.paginas
  if (conteudoGerado.paginas) { ... }
}, [resumo?.slides_json, conteudoGerado]);
```

2. **Remover mapeamento de tipos** - tipos já virão corretos do backend

3. **Usar objetivos do slides_json** se disponível

---

## Etapa 5: Atualizar Query para Buscar slides_json

Na query do RESUMO, adicionar seleção da nova coluna:

```typescript
const { data: resumo } = await supabase
  .from("RESUMO")
  .select("*, slides_json")  // Adicionar slides_json
  .eq("id", parsedResumoId!)
  .single();
```

---

## Arquivos a Modificar

| Arquivo | Mudanças |
|---------|----------|
| `supabase/functions/gerar-conteudo-resumo-oab/index.ts` | Reescrever para gerar 35-55 slides em seções, salvar em slides_json |
| `supabase/functions/gerar-capa-subtema-resumo/index.ts` | Usar mesmo método de Conceitos (gemini-2.5-flash-image + TinyPNG) |
| `src/pages/oab/OABTrilhasSubtemaEstudo.tsx` | Ler slides_json primeiro, fallback para conteudo_gerado |

---

## Fluxo Final do Usuário

1. Usuário entra no subtema da OAB
2. Se `slides_json` existe e tem 20+ páginas: mostra tela de introdução com objetivos
3. Clica em "Começar Leitura": entra no `ConceitosSlidesViewer` (idêntico)
4. Footer com navegação, índice e ruído marrom (já funciona)
5. Ao completar: progresso salvo, flashcards desbloqueados

---

## Seção Técnica

### Estrutura do slides_json (RESUMO)

```json
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
        {
          "tipo": "introducao",
          "titulo": "O que você vai aprender",
          "conteudo": "Texto..."
        },
        {
          "tipo": "texto",
          "titulo": "Conceito X",
          "conteudo": "Explicação extensa..."
        },
        {
          "tipo": "termos",
          "titulo": "Termos Importantes",
          "conteudo": "Introdução",
          "termos": [{"termo": "...", "definicao": "..."}]
        },
        {
          "tipo": "quickcheck",
          "titulo": "Verificação Rápida",
          "pergunta": "...",
          "opcoes": ["A", "B", "C", "D"],
          "resposta": 0,
          "feedback": "..."
        }
      ]
    }
  ]
}
```

### Prompt de Estrutura (Novo)

Será idêntico ao de `gerar-conteudo-conceitos` e `gerar-conteudo-oab-trilhas`:
1. Gerar esqueleto com 5-7 seções
2. Cada seção com 6-10 páginas
3. Tipos distribuídos (introducao, texto, termos, quickcheck, caso, dica, tabela, resumo)

### Validação Mínima

- Mínimo 20 páginas (igual Conceitos)
- Cada seção deve ter pelo menos 3 slides
- Se falhar validação: status = "erro" (não concluído falso)

---

## Compatibilidade

- Conteúdos antigos continuam funcionando via fallback `conteudo_gerado.paginas`
- Novos conteúdos terão `slides_json` preenchido
- Possível migração futura de conteúdos antigos (opcional)

---

## Resultado Esperado

Após implementação, a experiência do subtema OAB será **100% idêntica** aos Conceitos:
- Mesma quantidade de páginas (35-55)
- Mesmos tipos de slide interativos
- Mesma qualidade de capas (Gemini + TinyPNG 1280x720)
- Mesmo viewer e footer
- Mesmo sistema de progresso
