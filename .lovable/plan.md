
# Plano: Carregamento Instantâneo das Bibliotecas

## Problema Identificado

A página `/bibliotecas` utiliza:
1. **Imagem de fundo pesada**: `biblioteca-office-sunset.jpg` (214KB - formato JPG)
2. **8 capas de bibliotecas** em formato JPG não otimizado:
   - `capa-lideranca.jpg` (159KB)
   - `capa-fora-da-toga.jpg` (49KB)
   - `capa-classicos.jpg` (69KB)
   - `capa-oratoria.jpg` (159KB)
   - `capa-pesquisa-cientifica.jpg` (243KB)
   - `capa-portugues.jpg` (189KB)
   - `capa-biblioteca-oab.jpg` (36KB)
   - `capa-estudos-opt.webp` (49KB - já otimizada)

**Total: ~1.2MB de imagens** que não estão sendo pré-carregadas no início do app.

---

## Solução Proposta

### 1. Adicionar Todas as Capas ao GlobalImagePreloader

**Arquivo:** `src/components/GlobalImagePreloader.tsx`

Adicionar as imagens das bibliotecas ao array `SUPER_CRITICAL_IMAGES` para que sejam pré-carregadas via `<link rel="preload">` assim que o app iniciar:

```typescript
// Importar capas das bibliotecas
import heroBibliotecas from '@/assets/biblioteca-office-sunset.jpg';
import capaLideranca from '@/assets/capa-lideranca.jpg';
import capaForaDaToga from '@/assets/capa-fora-da-toga.jpg';
import capaEstudos from '@/assets/capa-estudos-opt.webp';
import capaClassicos from '@/assets/capa-classicos.jpg';
import capaOratoria from '@/assets/capa-oratoria.jpg';
import capaPesquisaCientifica from '@/assets/capa-pesquisa-cientifica.jpg';
import capaPortugues from '@/assets/capa-portugues.jpg';
import capaOab from '@/assets/capa-biblioteca-oab.jpg';
```

### 2. Otimizar Página de Bibliotecas

**Arquivo:** `src/pages/Bibliotecas.tsx`

- Remover animações de Framer Motion pesadas
- Usar detecção de cache instantâneo para mostrar imagens sem delay
- Configurar `loading="eager"`, `fetchPriority="high"` e `decoding="sync"` nas imagens críticas

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/GlobalImagePreloader.tsx` | Adicionar 8 capas de biblioteca ao preload |
| `src/pages/Bibliotecas.tsx` | Remover animações pesadas, usar preload instantâneo |

---

## Impacto Esperado

| Métrica | Antes | Depois |
|---------|-------|--------|
| Tempo de carregamento | ~2-3s | <100ms (cache) |
| Imagens pré-carregadas | 0/9 | 9/9 |
| Animações sequenciais | 8 delays | Nenhum |
| Flash branco | Visível | Eliminado |

---

## Seção Técnica

### Fluxo de Preload

```text
┌─────────────────────────────────────────────────────────────────┐
│  App Inicia                                                      │
│  └── GlobalImagePreloader monta                                  │
│       └── insertPreloadLinks() executa                          │
│            └── <link rel="preload"> criados no <head>           │
│                 └── Browser baixa imagens em paralelo (alta     │
│                      prioridade)                                 │
│                                                                  │
│  Usuário Navega para /bibliotecas                               │
│  └── Imagens já em cache do browser                             │
│       └── img.complete = true                                    │
│            └── Estado inicia como loaded                        │
│                 └── ZERO delay de renderização                  │
└─────────────────────────────────────────────────────────────────┘
```

### Verificação de Cache Instantâneo

O código usa verificação síncrona no `useState` inicial:
```typescript
const [imageLoaded, setImageLoaded] = useState(() => {
  const img = new Image();
  img.src = heroBibliotecas;
  return img.complete; // Retorna true se já em cache
});
```

Quando a imagem já foi pré-carregada pelo GlobalImagePreloader, `img.complete` retorna `true` imediatamente, eliminando qualquer loading.
