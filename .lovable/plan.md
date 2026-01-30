
# Plano: Reconstruir Trilhas de Conceitos 100% Baseado nas Trilhas OAB

## Objetivo

Excluir todo o codigo atual das Trilhas de Conceitos e refaze-lo copiando exatamente a estrutura e logica das Trilhas OAB primeira fase. O sistema de conceitos tera as mesmas paginas, mesmos componentes, mesmas edge functions e mesmo fluxo que a OAB.

---

## Parte 1: Mapeamento de Equivalencias

### Estrutura de Dados (Tabelas)

| OAB Trilhas | Conceitos | Descricao |
|-------------|-----------|-----------|
| `oab_trilhas_materias` | `conceitos_materias` | Areas/Materias principais |
| `oab_trilhas_topicos` | `conceitos_topicos` | Topicos dentro de cada area |
| `oab_trilhas_topico_paginas` | `conceitos_materia_paginas` | Paginas do PDF extraidas |
| `RESUMO` (contexto) | Nao usa | OAB busca contexto extra |

### Edge Functions

| OAB Trilhas | Conceitos Atual | Acao |
|-------------|-----------------|------|
| `gerar-conteudo-oab-trilhas` | `gerar-conteudo-conceitos` | Reescrever para ficar 100% igual |
| `processar-pdf-trilha-oab` | `processar-pdf-conceitos-materia` | Alinhar logica |
| `analisar-estrutura-trilha-oab` | `analisar-estrutura-conceitos` | Alinhar logica |
| `identificar-temas-oab` | `identificar-temas-conceitos` | Alinhar logica |
| `confirmar-subtemas-oab` | `confirmar-temas-conceitos` | Alinhar logica |

### Paginas Frontend

| OAB Trilhas | Conceitos Atual | Acao |
|-------------|-----------------|------|
| `TrilhasAprovacao.tsx` | `ConceitosTrilhante.tsx` | JA SIMILAR - manter |
| `OABTrilhasMateria.tsx` | `ConceitosMateria.tsx` | Reescrever para usar timeline |
| `OABTrilhasTopicos.tsx` | (nao existe) | Criar igual |
| `OABTrilhasTopicoEstudo.tsx` | `ConceitosTopicoEstudo.tsx` | Alinhar |
| `OABTrilhasReader.tsx` | `ConceitosReader.tsx` | JA SIMILAR - manter |
| `OABPdfProcessorModal.tsx` | `PdfProcessorModal.tsx` | Alinhar |

### Hooks

| OAB Trilhas | Conceitos |
|-------------|-----------|
| `useOABTrilhasAutoGeneration` | `useConceitosAutoGeneration` | JA SIMILAR |

---

## Parte 2: Arquivos a Excluir (codigo antigo)

Nenhum arquivo sera deletado fisicamente - todos serao SUBSTITUIDOS por versoes alinhadas com a OAB.

---

## Parte 3: Mudancas Detalhadas

### 3.1 Edge Function Principal: `gerar-conteudo-conceitos`

**Status atual:** Ja foi parcialmente alinhada, mas ainda tem diferencas.

**Mudancas necessarias:**

1. **Tabela de paginas PDF**: Atualmente busca de `conceitos_materia_paginas` por `materia_id` + range de paginas. OAB busca de `oab_trilhas_topico_paginas` por `topico_id`.

   Solucao: Criar tabela `conceitos_topico_paginas` identica a `oab_trilhas_topico_paginas` OU ajustar a logica para copiar as paginas do range para o topico antes de gerar.

2. **Busca de contexto**: OAB busca contexto extra da tabela `RESUMO` e de `buscar-contexto-base-oab`. Conceitos nao tem isso.

   Solucao: Simplificar - usar apenas o conteudo do PDF.

3. **Prompt**: Atualmente ja esta alinhado (8 paginas, tom conversacional).

4. **Logica de continuacao `gerarComContinuacao`**: Ja implementada identica.

5. **Parse de JSON**: Conceitos tem funcoes extras (`pickBestJsonCandidate`, `normalizeJsonLoose`, `escapeControlsInStringsOnly`) que OAB nao tem. Simplificar para usar a mesma logica da OAB.

### 3.2 Pagina `ConceitosMateria.tsx`

**Status atual:** Lista topicos em cards horizontais simples.

**Como esta na OAB (`OABTrilhasMateria.tsx`):**
- Design timeline com linha central vermelha
- Cards alternados esquerda/direita
- Animacao de pegadas pulsando
- Badge de progresso de geracao
- Capa herdada da area

**Mudancas:**
- Substituir o layout de lista por timeline identico a OAB
- Adicionar linha central vermelha com animacao
- Cards com capa, badge de status, numero da materia
- Integrar `OABTrilhasProgressBadge` (ou criar versao para Conceitos)

### 3.3 Modal de Processamento PDF

**OAB usa `OABPdfProcessorModal`:**
1. Usuario cola link do PDF
2. Chama `processar-pdf-trilha-oab` para extrair texto
3. Chama `analisar-estrutura-trilha-oab` para identificar temas
4. Mostra temas para confirmacao
5. Chama `confirmar-subtemas-oab` para criar topicos

**Conceitos usa `PdfProcessorModal`:**
1. Usuario cola link do PDF
2. Chama `processar-pdf-conceitos-materia`
3. Chama `identificar-temas-conceitos`
4. Mostra temas
5. Chama `confirmar-temas-conceitos`

**Mudancas:** Alinhar o fluxo e as edge functions chamadas.

### 3.4 Criar Tabela `conceitos_topico_paginas`

Para ficar 100% igual a OAB, cada topico precisa ter suas proprias paginas extraidas (nao buscar por range de paginas da materia).

**Schema:**
```sql
CREATE TABLE conceitos_topico_paginas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topico_id INTEGER REFERENCES conceitos_topicos(id) ON DELETE CASCADE,
  pagina INTEGER NOT NULL,
  conteudo TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(topico_id, pagina)
);
```

### 3.5 Edge Function `processar-pdf-conceitos`

Alinhar com `processar-pdf-trilha-oab`:
- Usar Mistral OCR identico
- Salvar em `conceitos_topico_paginas` (nao em `conceitos_materia_paginas`)
- Mesma logica de batch

### 3.6 Ajustar `gerar-conteudo-conceitos` para Usar Nova Tabela

```typescript
// ANTES (atual)
const { data: paginas } = await supabase
  .from("conceitos_materia_paginas")
  .select("pagina, conteudo")
  .eq("materia_id", topico.materia?.id)
  .gte("pagina", topico.pagina_inicial || 1)
  .lte("pagina", topico.pagina_final || 999);

// DEPOIS (igual OAB)
const { data: paginas } = await supabase
  .from("conceitos_topico_paginas")
  .select("pagina, conteudo")
  .eq("topico_id", topico_id)
  .order("pagina", { ascending: true });
```

---

## Parte 4: Sequencia de Implementacao

1. **Criar tabela `conceitos_topico_paginas`** (migracao SQL)

2. **Reescrever `gerar-conteudo-conceitos`**:
   - Copiar codigo exato de `gerar-conteudo-oab-trilhas`
   - Substituir nomes de tabelas (oab_trilhas_* -> conceitos_*)
   - Remover busca de contexto extra (RESUMO, base OAB)
   - Manter prompt para iniciantes

3. **Atualizar `processar-pdf-conceitos-materia`**:
   - Alinhar com `processar-pdf-trilha-oab`
   - Salvar paginas por topico (nao por materia)

4. **Atualizar `identificar-temas-conceitos` e `confirmar-temas-conceitos`**:
   - Alinhar com versoes OAB
   - Criar registros em `conceitos_topico_paginas` ao confirmar

5. **Reescrever `ConceitosMateria.tsx`**:
   - Copiar layout timeline de `OABTrilhasMateria.tsx`
   - Adaptar queries para tabelas de conceitos

6. **Criar componente `ConceitosProgressBadge`**:
   - Copiar `OABTrilhasProgressBadge`

7. **Testar fluxo completo**:
   - Upload PDF -> Identificar temas -> Confirmar -> Gerar conteudo

---

## Resumo dos Arquivos a Serem Alterados

### Edge Functions (supabase/functions/)
- `gerar-conteudo-conceitos/index.ts` - Reescrita significativa
- `processar-pdf-conceitos-materia/index.ts` - Ajustes
- `identificar-temas-conceitos/index.ts` - Ajustes
- `confirmar-temas-conceitos/index.ts` - Ajustes menores

### Paginas (src/pages/)
- `ConceitosMateria.tsx` - Reescrita para timeline

### Componentes (src/components/conceitos/)
- `PdfProcessorModal.tsx` - Ajustes menores
- Criar `ConceitosProgressBadge.tsx`

### Migracao SQL
- Criar tabela `conceitos_topico_paginas`

---

## Resultado Esperado

Apos a implementacao:
1. O fluxo de Conceitos sera 100% identico ao da OAB
2. A geracao de conteudo funcionara sem erros 500
3. O design sera consistente (timeline, pegadas, badges)
4. O sistema de fila funcionara corretamente
5. Cada topico tera suas paginas extraidas individualmente
