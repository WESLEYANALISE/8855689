
# Plano: Otimização Agressiva de Cache em Todo o App

## Diagnóstico Atual

O projeto já possui um sistema de cache robusto com três camadas:
1. **Memória** (Map em JavaScript) - acesso instantâneo
2. **IndexedDB** (via hooks customizados) - persistência local
3. **React Query** (in-memory) - gerenciamento de estado

### O que JA funciona bem:
- `useInstantCache` - hook universal cache-first
- `useCacheFirstArticles` - artigos de leis
- `useHomePreloader` - pré-carregamento da home
- `useFeaturedNews` - notícias com fallback padrão
- Carrosséis principais com preload de imagens

### Oportunidades identificadas (73 páginas com `setLoading(true)`):

---

## 1. Páginas de Conteúdo Frequente (ALTA PRIORIDADE)

### 1.1 VadeMecumLegislacao.tsx
- **Problema**: Faz fetch direto sem cache, mostra loading toda vez
- **Solução**: Migrar para `useInstantCache` com staleTime de 24h (legislação raramente muda)

### 1.2 Codigos.tsx / Estatutos.tsx / Constituicao.tsx
- **Problema**: Buscam lista de artigos sem cache persistente
- **Solução**: Usar `useCacheFirstArticles` que já existe, cache infinito

### 1.3 Sumulas.tsx (SumulaView)
- **Problema**: Dados estáticos carregados sem cache
- **Solução**: Migrar para `useInstantCache` com cache de 24h

### 1.4 NovasLeis.tsx
- **Problema**: Busca com paginação sem cache
- **Solução**: Implementar cache por página com `useInstantCache`

---

## 2. Páginas da Câmara/Senado (MÉDIA PRIORIDADE)

### 2.1 CamaraVotacoes / CamaraDeputados / CamaraProposicoes
- **Problema**: Fetch direto, loading toda navegação
- **Solução**: Cache de 30 minutos com stale-while-revalidate

### 2.2 SenadoMaterias / SenadoVotacoes / SenadoAgenda
- **Problema**: Sem cache, edge functions lentas
- **Solução**: Cache no localStorage + IndexedDB

---

## 3. Páginas de Estudo (ALTA PRIORIDADE)

### 3.1 CursoAulaView.tsx / CursosModulos.tsx
- **Problema**: Loading a cada navegação
- **Solução**: Cache infinito (conteúdo do curso não muda)

### 3.2 BloggerJuridicoArtigo.tsx
- **Problema**: Carrega artigo completo sem cache
- **Solução**: Usar cache do `useBloggerCache` já existente

### 3.3 FlashcardsTemas.tsx
- **Problema**: Faz query ao navegar entre áreas
- **Solução**: Prefetch ao hover + cache infinito

---

## 4. Otimizações de React Query Global

### 4.1 Aumentar staleTime padrão
Atualizar `src/lib/queryClient.ts` para configurações mais agressivas:

```typescript
// Antes: staleTime: 5 minutos
// Depois: staleTime por categoria

defaultOptions: {
  queries: {
    staleTime: 1000 * 60 * 30, // 30 minutos default
    gcTime: 1000 * 60 * 60 * 2, // 2 horas (antes era 30 min)
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  }
}
```

### 4.2 Adicionar categorias de cache

Expandir `src/config/cacheConfig.ts`:

```typescript
// Novos mapeamentos
'votacoes_camara': CACHE_STALE_TIMES.FREQUENT, // 30 min
'deputados_detalhes': CACHE_STALE_TIMES.HOURLY, // 1 hora
'cursos_aulas': CACHE_STALE_TIMES.STATIC, // 24 horas
'artigos_lei': CACHE_STALE_TIMES.STATIC, // 24 horas
'flashcards_temas': CACHE_STALE_TIMES.STATIC, // 24 horas
```

---

## 5. Novo Hook: useUniversalCache

Criar um hook unificado que:
- Usa localStorage para dados pequenos (< 100KB)
- Usa IndexedDB para dados maiores
- Sincroniza automaticamente com React Query
- Suporta prefetch em background

### Arquivo: `src/hooks/useUniversalCache.ts`

```typescript
interface UniversalCacheConfig<T> {
  key: string;
  queryFn: () => Promise<T>;
  staleTime?: number;
  storage?: 'local' | 'indexed' | 'auto';
  preloadImages?: boolean;
}

export function useUniversalCache<T>(config: UniversalCacheConfig<T>) {
  // Estratégia:
  // 1. Retorna dados de memória instantaneamente
  // 2. Se não tem em memória, tenta localStorage
  // 3. Se não tem em localStorage, tenta IndexedDB
  // 4. Se cache existe (mesmo stale), mostra
  // 5. Busca dados frescos em background
  // 6. NUNCA mostra loading se tem cache
}
```

---

## 6. Preloading Agressivo

### 6.1 Expandir useHomePreloader

Adicionar mais tabelas ao pré-carregamento:

```typescript
// Novas tabelas para preload
{
  cacheKey: 'votacoes-recentes',
  table: 'votacoes_cache',
  limit: 20,
},
{
  cacheKey: 'sumulas-vinculantes',
  table: 'SUMULAS-VINCULANTES',
  limit: 100,
},
{
  cacheKey: 'codigos-lista',
  table: 'codigos_disponiveis',
  limit: 50,
},
```

### 6.2 Prefetch por Rota

Criar hook `useRoutePrefetch` que pré-carrega dados baseado na rota:

```typescript
// Ao navegar para /vade-mecum, precarrega:
prefetchConfig['/vade-mecum'] = [
  'codigos-lista',
  'estatutos-lista',
  'sumulas-todas',
];

// Ao navegar para /cursos, precarrega:
prefetchConfig['/cursos'] = [
  'cursos-areas',
  'cursos-aulas-populares',
];
```

---

## 7. Páginas Específicas a Migrar

### Lista de arquivos a modificar:

| Arquivo | Estratégia | StaleTime |
|---------|------------|-----------|
| `VadeMecumLegislacao.tsx` | useInstantCache | 24h |
| `CamaraVotacoes.tsx` | useInstantCache | 30min |
| `CamaraDeputados.tsx` | useInstantCache | 1h |
| `CursoAulaView.tsx` | useInstantCache | Infinito |
| `CursosModulos.tsx` | useInstantCache | Infinito |
| `BloggerJuridicoArtigo.tsx` | useBloggerCache | 30min |
| `NovasLeis.tsx` | useInstantCache | 1h |
| `SenadoMaterias.tsx` | useInstantCache | 30min |
| `SenadoVotacoes.tsx` | useInstantCache | 30min |
| `MeuBrasilJuristaView.tsx` | useInstantCache | 24h |
| `MeuBrasilHistoriaView.tsx` | useInstantCache | 24h |

---

## 8. Detalhes de Implementação

### 8.1 Padrão de Migração

Para cada página:

```typescript
// ANTES
const [loading, setLoading] = useState(true);
const [data, setData] = useState([]);

useEffect(() => {
  setLoading(true);
  fetch().then(d => {
    setData(d);
    setLoading(false);
  });
}, []);

// DEPOIS
const { data, isLoading, isFetching } = useInstantCache({
  cacheKey: 'nome-unico',
  queryFn: async () => fetch(),
  cacheDuration: CACHE_STALE_TIMES.STATIC,
});
// isLoading é false se já tem cache
// isFetching indica refresh em background
```

### 8.2 Skeleton vs Loading

- **Com cache**: Mostra dados antigos + indicador sutil de atualização
- **Sem cache** (primeira visita): Skeleton shimmer bonito
- **NUNCA**: Tela em branco com spinner

---

## Resultado Esperado

| Métrica | Antes | Depois |
|---------|-------|--------|
| Primeira visita | 2-3s loading | < 500ms (preload) |
| Navegação subsequente | 500ms-2s | Instantâneo |
| Retorno ao app | Loading completo | Dados do cache |
| Offline | Erro | Funciona com cache |

---

## Ordem de Implementação

1. **Fase 1**: Configurações globais do React Query
2. **Fase 2**: Expandir useHomePreloader com novas tabelas
3. **Fase 3**: Migrar páginas de alta frequência (Vade Mecum, Cursos)
4. **Fase 4**: Migrar páginas Câmara/Senado
5. **Fase 5**: Migrar páginas de detalhes (Artigos, Juristas)
6. **Fase 6**: Implementar prefetch por rota

---

## Arquivos a Modificar

### Configurações:
- `src/lib/queryClient.ts` - defaults globais
- `src/config/cacheConfig.ts` - mapeamentos

### Hooks:
- `src/hooks/useHomePreloader.ts` - mais tabelas
- Criar `src/hooks/useUniversalCache.ts`

### Páginas (principais):
- `src/pages/VadeMecumLegislacao.tsx`
- `src/pages/CamaraVotacoes.tsx`
- `src/pages/CamaraDeputados.tsx`
- `src/pages/CursoAulaView.tsx`
- `src/pages/CursosModulos.tsx`
- `src/pages/NovasLeis.tsx`
- `src/pages/BloggerJuridicoArtigo.tsx`
- `src/pages/SenadoMaterias.tsx`
- `src/pages/MeuBrasilJuristaView.tsx`

