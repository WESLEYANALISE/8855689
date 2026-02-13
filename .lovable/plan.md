

## Problema Identificado

O cache do IndexedDB contém apenas 150 artigos antigos do Código Civil. O sistema detecta que há 2388 artigos no banco, mas ao tentar atualizar, ele lê o mesmo cache antigo novamente, criando um **loop infinito** sem nunca buscar dados novos do Supabase.

Fluxo do bug:
1. Cache IndexedDB tem 150 artigos
2. Sistema carrega cache e mostra 150 artigos
3. `checkForUpdates` detecta diferença (150 vs 2388)
4. Reseta estado e chama `loadInitial()` novamente
5. `loadInitial` encontra o mesmo cache de 150 artigos
6. Volta ao passo 2 (loop infinito)

## Solução

Corrigir o hook `useProgressiveArticles.ts` para que, quando detectar dados desatualizados no cache, limpe o cache primeiro e force o carregamento direto do Supabase (sem ler o cache novamente).

### Mudancas Tecnicas

**Arquivo: `src/hooks/useProgressiveArticles.ts`**

1. Na funcao `checkForUpdates`: ao detectar mudanca, primeiro limpar o cache do IndexedDB antes de recarregar, e usar uma flag (`skipCache`) para forcar busca direta do Supabase.

2. Adicionar um `useRef` (`skipCacheRef`) que, quando ativo, faz o `loadInitial` pular a leitura do cache e ir direto para o carregamento progressivo do Supabase.

3. Na funcao `loadInitial`: verificar `skipCacheRef.current` e, se verdadeiro, ignorar `cachedData` e carregar do Supabase diretamente.

4. Importar `clearCache` do hook `useIndexedDBCache` para poder limpar dados obsoletos.

Isso resolve tanto o loop infinito quanto garante que todos os 2388 artigos sejam carregados e salvos no cache para visitas futuras.

