
# Corrigir Conteudo Zerado nas Categorias

## Problemas Identificados

### Problema 1: Parametro da rota incorreto (causa principal do "zerado")
A rota no `App.tsx` define o parametro como `:id`:
```
/categorias/topico/:id
```
Mas o componente `CategoriasTopicoEstudo.tsx` tenta ler `topicoId`:
```
const { topicoId } = useParams();
```
Como `topicoId` e sempre `undefined`, a query nunca encontra o topico e tudo aparece zerado (0 paginas, 0 flashcards, 0 questoes), apesar dos dados existirem no banco (confirmado: topico 31 tem 51 slides, 22 flashcards, 17 questoes).

### Problema 2: Reprocessar PDF apaga todo o conteudo gerado
No `confirmar-temas-categorias/index.ts` (linha 85), ao reprocessar:
```
await supabase.from('categorias_topicos').delete().eq('materia_id', materiaId);
```
Isso deleta TODOS os topicos (incluindo conteudo ja gerado), diferente do OAB que preserva conteudo existente.

## Solucao

### Correcao 1 - Parametro da rota
No arquivo `src/pages/CategoriasTopicoEstudo.tsx`, mudar:
```
const { topicoId } = useParams();
```
Para:
```
const { id: topicoId } = useParams();
```
Isso resolve o problema do conteudo zerado. Todas as referencias a `topicoId` no componente continuam funcionando sem outras alteracoes.

Tambem corrigir as rotas de flashcards e questoes que provavelmente tem o mesmo problema (parametro `:id` na rota vs leitura diferente no componente).

### Correcao 2 - Preservar conteudo ao reprocessar PDF
No `confirmar-temas-categorias/index.ts`, em vez de deletar todos os topicos e recriar:
- Comparar os temas novos com os existentes
- Atualizar os que ja existem (preservando `conteudo_gerado`, `flashcards`, `questoes`)
- Adicionar apenas os novos
- Remover apenas os que nao estao mais na lista

## Arquivos a Modificar

1. `src/pages/CategoriasTopicoEstudo.tsx` - corrigir `useParams`
2. `src/pages/CategoriasTopicoFlashcards.tsx` - verificar e corrigir `useParams` (se necessario)
3. `src/pages/CategoriasTopicoQuestoes.tsx` - verificar e corrigir `useParams` (se necessario)
4. `supabase/functions/confirmar-temas-categorias/index.ts` - preservar conteudo existente ao reprocessar

## Detalhes Tecnicos

### useParams fix
A mudanca e minima - apenas renomear a desestruturacao:
```typescript
// ANTES
const { topicoId } = useParams();

// DEPOIS  
const { id: topicoId } = useParams();
```

### Preservar conteudo no reprocessamento
Em vez de `DELETE + INSERT`, usar logica de merge:

```text
1. Buscar topicos existentes com conteudo
2. Para cada tema novo:
   a. Se ja existe (por titulo normalizado) -> UPDATE (manter conteudo_gerado, flashcards, questoes)
   b. Se nao existe -> INSERT como pendente
3. Topicos existentes que nao estao na nova lista -> DELETE (ou manter como inativos)
```

Isso garante que o conteudo ja gerado pela IA nao seja perdido ao reprocessar o PDF.
