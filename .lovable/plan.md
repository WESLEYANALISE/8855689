
# Gerar 5 Topicos em Paralelo (Todas as Trilhas)

## Problema Atual

O backend (Edge Functions) so permite **1 geracao ativa por materia**. Quando o frontend dispara 10 chamadas simultaneas, a edge function aceita a primeira e coloca as outras 9 na fila ("na_fila"). Por isso voce ve apenas 1 gerando, mesmo com o limite do frontend em 10.

## Solucao

Modificar tanto o **frontend** (hooks) quanto o **backend** (edge functions) para permitir **5 geracoes simultaneas por materia**, em ordem.

---

## Parte 1: Frontend - Padronizar todos os hooks com limite 5

### Arquivos a modificar:
- `src/hooks/useCategoriasAutoGeneration.ts` - Alterar CONCURRENT_GENERATIONS de 10 para 5
- `src/hooks/useOABTrilhasAutoGeneration.ts` - Alterar CONCURRENT_GENERATIONS de 10 para 5
- `src/hooks/useOABAutoGeneration.ts` - Alterar CONCURRENT_GENERATIONS de 10 para 5
- `src/hooks/useConceitosAutoGeneration.ts` - Reescrever de sequencial para batch (5 simultaneos), usando o mesmo padrao dos outros hooks (findNextPendingBatch + startBatchGeneration)

---

## Parte 2: Backend - Permitir 5 geracoes simultaneas

### Edge Functions a modificar:

**1. `supabase/functions/gerar-conteudo-categorias/index.ts`** (linhas 80-139)
- Atualmente: verifica se existe 1 topico com status="gerando" e enfileira se existir
- Novo: contar quantos topicos estao com status="gerando" na mesma materia. So enfileirar se ja houver 5 ou mais ativos

**2. `supabase/functions/gerar-conteudo-oab-trilhas/index.ts`** (mesma logica)
- Mesmo ajuste: permitir ate 5 topicos com status="gerando" simultaneamente antes de enfileirar

**3. `supabase/functions/gerar-conteudo-conceitos/index.ts`** (mesma logica)
- Mesmo ajuste: permitir ate 5 topicos com status="gerando" simultaneamente antes de enfileirar

### Logica modificada nas Edge Functions:

```text
ANTES:
  Se existe 1 topico "gerando" na materia → enfileira

DEPOIS:
  Contar topicos "gerando" na materia
  Se count >= 5 → enfileira
  Se count < 5 → processa normalmente
```

A query muda de `.single()` (buscar 1 ativo) para `.select("id", { count: "exact", head: true })` (contar ativos).

---

## Parte 3: Ordem garantida

Os hooks ja ordenam por `ordem ASC` ao buscar pendentes. Os primeiros 5 pendentes em ordem serao disparados. Quando um termina, o proximo na ordem e iniciado automaticamente.

---

## Resumo de arquivos

| Arquivo | Mudanca |
|---------|---------|
| `src/hooks/useCategoriasAutoGeneration.ts` | CONCURRENT = 10 para 5 |
| `src/hooks/useOABTrilhasAutoGeneration.ts` | CONCURRENT = 10 para 5 |
| `src/hooks/useOABAutoGeneration.ts` | CONCURRENT = 10 para 5 |
| `src/hooks/useConceitosAutoGeneration.ts` | Reescrever para batch de 5 (atualmente gera 1 por vez) |
| `supabase/functions/gerar-conteudo-categorias/index.ts` | Permitir 5 ativos antes de enfileirar |
| `supabase/functions/gerar-conteudo-oab-trilhas/index.ts` | Permitir 5 ativos antes de enfileirar |
| `supabase/functions/gerar-conteudo-conceitos/index.ts` | Permitir 5 ativos antes de enfileirar |
