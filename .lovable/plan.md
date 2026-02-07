# Plano: Otimização Agressiva de Cache - IMPLEMENTADO ✅

## Status: Fases 1-4 Concluídas

### ✅ Fase 1: Configurações Globais do React Query
- `src/App.tsx`: staleTime 30min, gcTime 2h, refetch desabilitado

### ✅ Fase 2: Expandir cacheConfig
- `src/config/cacheConfig.ts`: +30 novos mapeamentos de cache por categoria

### ✅ Fase 3: Criar useUniversalCache  
- `src/hooks/useUniversalCache.ts`: Hook com 3 camadas (memória → localStorage → IndexedDB)

### ✅ Fase 4: Expandir useHomePreloader
- `src/hooks/useHomePreloader.ts`: +10 novas tabelas, 250 imagens preload

### ✅ Fase 5: Expandir useRoutePrefetch
- `src/hooks/useRoutePrefetch.ts`: +10 novas rotas com prefetch contextual

---

## Próximas Fases (Quando Necessário)

### Fase 6: Migrar Páginas Específicas
Páginas a migrar para `useUniversalCache`:
- `VadeMecumLegislacao.tsx`
- `CamaraVotacoes.tsx` / `CamaraDeputados.tsx`
- `CursoAulaView.tsx` / `CursosModulos.tsx`
- `SenadoMaterias.tsx` / `SenadoVotacoes.tsx`
- `MeuBrasilJuristaView.tsx` / `MeuBrasilHistoriaView.tsx`

---

## Resultado Atual

| Métrica | Antes | Depois |
|---------|-------|--------|
| staleTime global | 5 min | 30 min |
| gcTime global | 30 min | 2 horas |
| Tabelas preload | 10 | 20+ |
| Imagens preload | 150 | 250 |
| Rotas com prefetch | 5 | 15+ |
| Cache categories | 15 | 45+ |


