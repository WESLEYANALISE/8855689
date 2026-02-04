
# Plano: Melhorias de Performance e UX nas Trilhas OAB

## Problemas Identificados

1. **Carregamento lento ao voltar**: Quando o usuário entra numa matéria e volta, a lista demora a recarregar
2. **Card desnecessário**: Banner verde "Todos os X conteúdos foram gerados!" aparece sem necessidade
3. **Imagens demorando**: Capas das áreas/matérias demoram a carregar
4. **Travamentos gerais**: A interface às vezes congela durante navegação

## Solução Proposta

### 1. Cache Agressivo com `staleTime: Infinity`

Alterarei as queries para usar cache infinito, eliminando refetches desnecessários:

```text
┌─────────────────────────────────────────────────────────┐
│  ANTES (cache 5-10 min)          DEPOIS (Infinity)     │
├─────────────────────────────────────────────────────────┤
│  Usuário volta → refetch         Usuário volta → cache │
│  1-2s de loading                 0ms (instantâneo)     │
└─────────────────────────────────────────────────────────┘
```

### 2. Prefetch de Matérias ao Carregar Áreas

Quando a lista de áreas carrega, já pré-carregarei todas as matérias de cada área em background:

```typescript
// TrilhasAprovacao.tsx - Prefetch automático
useEffect(() => {
  if (materias) {
    materias.forEach(materia => {
      queryClient.prefetchQuery({
        queryKey: ["oab-trilha-materias-da-area", materia.id],
        queryFn: () => fetchMaterias(materia.id),
        staleTime: Infinity,
      });
    });
  }
}, [materias]);
```

### 3. Remover Banner de Conclusão

Removerei o card verde que mostra "Todos os X conteúdos foram gerados!" na página `OABTrilhasMateria.tsx` (linhas 309-319).

### 4. Otimização de Imagens com `preloadImages`

Utilizarei o sistema de cache de imagens já existente (`useInstantCache`) para pré-carregar capas:

```typescript
// Preload agressivo das capas
useEffect(() => {
  if (materias) {
    const urls = materias
      .map(m => m.capa_url)
      .filter(Boolean);
    preloadImages(urls);
  }
}, [materias]);
```

### 5. Reduzir Polling de Progresso

O polling a cada 2-3s causa requisições desnecessárias. Aumentarei o intervalo quando não há geração ativa e usarei invalidação manual após mutations.

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/oab/TrilhasAprovacao.tsx` | Adicionar prefetch de matérias, cache infinito |
| `src/pages/oab/OABTrilhasMateria.tsx` | Remover banner, cache infinito, preload imagens |
| `src/hooks/useOABTrilhasAutoGeneration.ts` | Aumentar intervalo de polling |

## Detalhes Técnicos

### TrilhasAprovacao.tsx

- `staleTime: Infinity` e `gcTime: Infinity` para queries de áreas e contagens
- Prefetch em background de todas as matérias usando `queryClient.prefetchQuery`
- Preload de imagens de capa via `preloadImages()`

### OABTrilhasMateria.tsx

- Remover linhas 309-319 (banner verde de conclusão)
- `staleTime: Infinity` para queries de área e matérias
- Preload de imagens de capa da área
- Remover `refetchOnMount: "always"` para usar cache

### useOABTrilhasAutoGeneration.ts

- Aumentar polling de 2s para 5s quando gerando
- Desabilitar polling quando não há geração ativa

## Resultado Esperado

1. **Navegação instantânea** entre área e matérias (0ms de loading)
2. **Imagens pré-carregadas** antes mesmo de clicar
3. **Interface mais fluida** com menos requisições de rede
4. **Sem banner desnecessário** ocupando espaço visual
