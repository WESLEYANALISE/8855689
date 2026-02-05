
# Plano de Otimização de Performance - App Direito X

## Visão Geral

Após análise extensiva do código, identifiquei **242 arquivos usando framer-motion** e **455 arquivos com animações CSS**. O app tem mais de 500 páginas e componentes. As principais áreas de melhoria são:

1. **Animações pesadas** → Substituir por CSS nativo ou versões leves
2. **Cache inconsistente** → Padronizar `staleTime` e `gcTime`
3. **Re-renders excessivos** → Memoização estratégica
4. **Carregamento de imagens** → Lazy loading agressivo
5. **Componentes não otimizados** → Code splitting + suspense

---

## 1. ANIMAÇÕES - Substituir Framer-Motion por CSS Nativo

### Problema Atual
- 242 arquivos usam `framer-motion`
- AnimatePresence causa re-renders em toda a árvore
- Animações de entrada/saída são GPU-intensivas

### Solução

#### 1.1 Criar utilitário de animações CSS leves
```tsx
// src/lib/animations.ts
export const fadeIn = "animate-[fadeIn_200ms_ease-out]";
export const slideUp = "animate-[slideUp_200ms_ease-out]";
export const slideDown = "animate-[slideDown_200ms_ease-out]";
export const scaleIn = "animate-[scaleIn_150ms_ease-out]";
```

#### 1.2 Adicionar keyframes ao Tailwind
```css
/* index.css */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
```

#### 1.3 Substituir componentes críticos

**FlashcardViewer.tsx** - Remover AnimatePresence:
```tsx
// ANTES (pesado)
<AnimatePresence mode="wait">
  <motion.div variants={slideVariants} initial="enter" animate="center" exit="exit">

// DEPOIS (leve)
<div key={currentIndex} className="animate-[slideUp_200ms_ease-out]">
```

**FlashcardStack.tsx** - CSS puro para flip:
```tsx
// ANTES
<motion.div animate={{ rotateY: isFlipped ? 180 : 0 }} transition={{ duration: 0.5 }}>

// DEPOIS
<div className={`transition-transform duration-300 ${isFlipped ? 'rotate-y-180' : ''}`} style={{ transformStyle: 'preserve-3d' }}>
```

**Modais e Drawers** - Usar CSS transforms:
```tsx
// ANTES
<motion.div initial={{ y: '100%' }} animate={{ y: 0 }}>

// DEPOIS
<div className="animate-[slideUp_200ms_ease-out]">
```

### Componentes Prioritários para Otimizar
1. `FlashcardViewer.tsx` - usado em todas as áreas de flashcards
2. `FlashcardStack.tsx` - usado nas trilhas OAB
3. `EmAltaSection.tsx` - página inicial (alta frequência)
4. `NoticiaCarouselCard.tsx` - carrossel de notícias
5. Todos os modais com AnimatePresence

---

## 2. CACHE DO REACT QUERY - Padronização

### Problema Atual
- Algumas queries usam `staleTime: Infinity`, outras `staleTime: 0`
- Re-fetches desnecessários causam tela preta
- Cache não persistente entre navegações

### Solução

#### 2.1 Configuração global do QueryClient
```tsx
// src/App.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos padrão
      gcTime: 1000 * 60 * 30,   // 30 minutos no garbage collector
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

#### 2.2 Páginas mais acessadas - Cache infinito
Aplicar `staleTime: Infinity` nas seguintes páginas:

| Página | Arquivo | Razão |
|--------|---------|-------|
| Index | Index.tsx | Página inicial |
| Flashcards Areas | FlashcardsAreas.tsx | Lista de áreas |
| Flashcards Temas | FlashcardsTemas.tsx | Lista de temas |
| Bibliotecas | Bibliotecas.tsx | Lista de bibliotecas |
| Cursos | Cursos.tsx | Lista de cursos |
| Videoaulas | VideoaulasAreas.tsx | Lista de videoaulas |
| OAB Trilhas | TrilhasAprovacao.tsx | Dashboard OAB |

#### 2.3 Padrão de cache por tipo de dados
```tsx
// Dados estáticos (códigos, leis, artigos)
staleTime: Infinity, gcTime: Infinity

// Dados semi-dinâmicos (progresso, flashcards gerados)
staleTime: 1000 * 60 * 5, gcTime: 1000 * 60 * 30

// Dados dinâmicos (notícias, proposições)
staleTime: 1000 * 60 * 2, gcTime: 1000 * 60 * 10
```

---

## 3. MEMOIZAÇÃO E RE-RENDERS

### Problema Atual
- Componentes grandes re-renderizam a cada mudança de estado
- Callbacks criados em cada render
- Context providers causando cascata de re-renders

### Solução

#### 3.1 Memoizar componentes pesados
```tsx
// Layout.tsx - já está memoizado (bom!)
const MemoizedHeader = memo(Header);
const MemoizedBottomNav = memo(BottomNav);

// Adicionar em mais componentes críticos:
export const FlashcardViewer = memo(({ flashcards, ... }) => { ... });
export const NoticiaCarouselCard = memo(({ noticia, ... }) => { ... });
export const EmAltaSection = memo(({ ... }) => { ... });
```

#### 3.2 useCallback para handlers
```tsx
// FlashcardViewer - callbacks estáveis
const handleNext = useCallback(() => {
  stopAllAudio();
  setIsFlipped(false);
  setDirection('right');
  setCurrentIndex(prev => (prev + 1) % flashcards.length);
}, [flashcards.length, stopAllAudio]);
```

#### 3.3 useMemo para cálculos pesados
```tsx
// Index.tsx - já usa useMemo para heroImage (bom!)
// Adicionar para listas filtradas:
const filteredTemas = useMemo(() => 
  temas?.filter(t => t.nome.includes(searchTerm)) || [],
  [temas, searchTerm]
);
```

---

## 4. IMAGENS - LAZY LOADING AGRESSIVO

### Problema Atual
- Algumas imagens carregam com `loading="eager"` desnecessariamente
- Carrosséis carregam todas as imagens de uma vez
- Imagens fora da viewport consomem banda

### Solução

#### 4.1 Lazy loading padrão
```tsx
// Todas as imagens exceto hero devem usar:
<img 
  src={url}
  loading="lazy"
  decoding="async"
  fetchPriority="auto"
/>
```

#### 4.2 Apenas imagens críticas com eager
```tsx
// APENAS para hero images e LCP (Largest Contentful Paint):
<img 
  src={heroImage}
  loading="eager"
  decoding="sync"
  fetchPriority="high"
/>
```

#### 4.3 Intersection Observer para carrosséis
```tsx
// Carregar imagens apenas quando próximas de entrar na viewport
const { ref, inView } = useInView({
  triggerOnce: true,
  rootMargin: '100px'
});

<img 
  ref={ref}
  src={inView ? url : placeholder}
  loading="lazy"
/>
```

---

## 5. CODE SPLITTING - LAZY LOADING DE PÁGINAS

### Problema Atual
- App.tsx importa TODAS as páginas diretamente (linhas 24-500+)
- Bundle inicial muito grande
- Tempo de carregamento inicial alto

### Solução

#### 5.1 Lazy import para páginas secundárias
```tsx
// App.tsx - Manter direto apenas as páginas mais usadas:
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import FlashcardsAreas from "./pages/FlashcardsAreas";

// Lazy para todas as outras:
const BibliotecaClassicos = lazy(() => import("./pages/BibliotecaClassicos"));
const CamaraDeputados = lazy(() => import("./pages/CamaraDeputados"));
const Eleicoes = lazy(() => import("./pages/Eleicoes"));
// ... etc
```

#### 5.2 Agrupar por rota
```tsx
// Rotas admin - lazy como grupo
const AdminRoutes = lazy(() => import("./routes/AdminRoutes"));

// Rotas OAB - lazy como grupo
const OABRoutes = lazy(() => import("./routes/OABRoutes"));
```

---

## 6. CSS - OTIMIZAÇÕES ESPECÍFICAS

### 6.1 Reduzir animações com prefers-reduced-motion
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 6.2 Contain para isolamento de layout
```css
/* Componentes que não afetam o layout externo */
.card-isolated {
  contain: layout style paint;
}
```

### 6.3 Will-change apenas quando necessário
```css
/* Remover will-change após animação */
.animating {
  will-change: transform, opacity;
}

.animated {
  will-change: auto;
}
```

---

## 7. PRIORIDADES DE IMPLEMENTAÇÃO

### Fase 1 - Impacto Imediato (Alta prioridade)
1. Configurar QueryClient global com defaults otimizados
2. Substituir AnimatePresence no FlashcardViewer
3. Adicionar `staleTime: Infinity` nas 7 páginas mais acessadas
4. Memoizar NoticiaCarouselCard e EmAltaSection

### Fase 2 - Performance Sustentada
5. Lazy loading para 80% das páginas
6. CSS animations para modais/drawers
7. Intersection Observer para imagens de carrossel

### Fase 3 - Polimento
8. Prefers-reduced-motion
9. CSS containment
10. Monitoramento de performance contínuo

---

## 8. MÉTRICAS ESPERADAS

| Métrica | Antes | Depois |
|---------|-------|--------|
| Bundle inicial | ~2MB | ~800KB |
| TTI (Time to Interactive) | ~3s | ~1.2s |
| Re-renders por navegação | 5-10 | 1-2 |
| Animações bloqueantes | Muitas | Zero |
| Cache hits | ~20% | ~80% |

---

## Detalhes Técnicos

### Arquivos a Modificar
1. `src/App.tsx` - QueryClient config + lazy imports
2. `src/index.css` - Keyframes CSS leves
3. `src/components/FlashcardViewer.tsx` - Remover framer-motion
4. `src/components/conceitos/FlashcardStack.tsx` - CSS puro para flip
5. `src/components/EmAltaSection.tsx` - Memoização
6. `src/pages/FlashcardsTemas.tsx` - Cache otimizado
7. `src/pages/FlashcardsAreas.tsx` - Cache otimizado
8. ~20 páginas principais - staleTime: Infinity

### Dependências
- Nenhuma nova dependência necessária
- Redução de uso do framer-motion (mantém para casos complexos)
