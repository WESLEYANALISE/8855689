
# Plano: Carregamento Instantâneo das Imagens de Carreiras

## Status Atual das Imagens

**Formato**: ✅ Já otimizadas em WebP
- `carreira-advogado.webp` (~62KB)
- `carreira-juiz.webp` (~57KB)
- `carreira-delegado.webp` (~48KB)
- `carreira-promotor.webp` (~59KB)
- `carreira-prf.webp` (~63KB)
- `pf-004-opt.webp` (~36KB)

---

## Problemas Identificados

1. **Lazy loading inadequado**: As imagens usam `loading="lazy"` mesmo sendo visíveis no início da tela
2. **Sem preload**: As imagens não são pré-carregadas quando o app inicia
3. **Animações lentas**: A página CarreirasJuridicas usa framer-motion com delays sequenciais (0.08s × 10 cards = 800ms de espera)

---

## Solução Proposta

### 1. Preload das Imagens no Index.tsx

Adicionar preload das imagens de carreiras assim que o Index monta, garantindo que estejam no cache antes de serem exibidas.

**Arquivo:** `src/pages/Index.tsx`

```typescript
import { preloadImages } from '@/hooks/useInstantCache';

// Importar imagens de carreiras para preload
import carreiraAdvogado from "@/assets/carreira-advogado.webp";
import carreiraJuiz from "@/assets/carreira-juiz.webp";
import carreiraDelegado from "@/assets/carreira-delegado.webp";
import carreiraPromotor from "@/assets/carreira-promotor.webp";
import carreiraPrf from "@/assets/carreira-prf.webp";
import carreiraPf from "@/assets/pf-004-opt.webp";

// No componente Index:
useEffect(() => {
  // Preload das imagens de carreiras
  preloadImages([
    carreiraAdvogado,
    carreiraJuiz,
    carreiraDelegado,
    carreiraPromotor,
    carreiraPrf,
    carreiraPf,
  ]);
}, []);
```

### 2. Atualizar CarreirasSection para Loading Eager

**Arquivo:** `src/components/CarreirasSection.tsx`

- Trocar `loading="lazy"` por `loading="eager"` nas imagens
- Adicionar `decoding="async"` para não bloquear renderização
- Usar UniversalImage com blur placeholder para transição suave

### 3. Otimizar CarreirasJuridicas (Página "Ver mais")

**Arquivo:** `src/pages/CarreirasJuridicas.tsx`

- Remover delays sequenciais do framer-motion (0.08 × index)
- Usar animação de entrada única para todo o grid
- Trocar motion.img por img com transições CSS
- Adicionar preload das imagens adicionais (defensor, procurador, pcivil, pmilitar)

### 4. Otimizar DesktopHomeDestaque

**Arquivo:** `src/components/desktop/DesktopHomeDestaque.tsx`

- Trocar `loading="lazy"` por `loading="eager"` nas imagens de carreiras

---

## Detalhes Técnicos

### CarreirasSection.tsx - Mudanças

```text
Antes:
<img src={item.image} loading="lazy" ... />

Depois:
<img 
  src={item.image} 
  loading="eager"
  decoding="async"
  fetchPriority="high"
  ... 
/>
```

### CarreirasJuridicas.tsx - Mudanças

```text
Antes:
<motion.button
  initial={{ opacity: 0, y: 30, scale: 0.9 }}
  animate={{ opacity: 1, y: 0, scale: 1 }}
  transition={{ delay: index * 0.08, ... }}
>
  <motion.img 
    initial={{ scale: 1.1 }}
    animate={{ scale: 1 }}
    transition={{ duration: 0.6, delay: index * 0.08 }}
  />
</motion.button>

Depois:
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
  className="grid grid-cols-2 gap-4"
>
  {carreiras.map((carreira) => (
    <button className="transition-transform hover:scale-103 ...">
      <img 
        src={carreira.capa}
        loading="eager"
        fetchPriority="high"
        className="transition-transform duration-300 hover:scale-110 ..."
      />
    </button>
  ))}
</motion.div>
```

### Index.tsx - Preload no Mount

```typescript
// Preload all career images on mount
useEffect(() => {
  const carreiraImages = [
    carreiraAdvogado, carreiraJuiz, carreiraDelegado,
    carreiraPromotor, carreiraPrf, carreiraPf
  ];
  preloadImages(carreiraImages);
}, []);
```

---

## Resultado Esperado

| Situação | Antes | Depois |
|----------|-------|--------|
| Primeira visita | ~1-2s para carregar imagens | ~200ms (preload em background) |
| Navegações futuras | Carrega do cache do browser | Instantâneo (já em memória) |
| Clique em "Ver mais" | ~800ms de delays de animação | ~200ms animação única |
| Desktop | Lazy loading visível | Imagens já carregadas |

---

## Arquivos a Modificar

1. `src/pages/Index.tsx` - Adicionar preload de imagens
2. `src/components/CarreirasSection.tsx` - Loading eager + fetchPriority
3. `src/pages/CarreirasJuridicas.tsx` - Remover delays, simplificar animações
4. `src/components/desktop/DesktopHomeDestaque.tsx` - Loading eager
