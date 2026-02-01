
# Plano: Ajustar Animação e Som de Transição de Páginas nos Conceitos

## Objetivo
Tornar a transição entre páginas no visualizador de Conceitos mais fluida e usar o mesmo som de virar página da OAB Trilhas.

---

## Mudanças Identificadas

### 1. Som de Transição

**Problema Atual:**
- `ConceitosSlidesViewer.tsx` usa: `/sounds/page-flip.mp3`

**Solução (igual à OAB Trilhas):**
- `OABTrilhasReader.tsx` usa: `https://files.catbox.moe/g2jrb7.mp3`
- Trocar para usar o mesmo som externo com volume 0.4

**Arquivo a modificar:** `src/components/conceitos/slides/ConceitosSlidesViewer.tsx`

---

### 2. Animação de Transição

**Problema Atual (linha 80-93 do ConceitoSlideCard.tsx):**
```javascript
const slideVariants = {
  enter: (direction) => ({ x: direction === 'next' ? '100%' : '-100%', opacity: 1 }),
  center: { x: 0, opacity: 1 },
  exit: (direction) => ({ x: direction === 'next' ? '-100%' : '100%', opacity: 1 })
};
// Transition: tween, 0.3s, easeInOut
```

**Solução (inspirada no OABTrilhasReader - linha 637-641):**
```javascript
const slideVariants = {
  enter: (dir) => ({ x: dir === 'next' ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir === 'next' ? -80 : 80, opacity: 0 })
};
// Transition: spring mais suave OU tween com duração menor
```

A animação da OAB Trilhas usa:
- Deslocamento menor (80px ao invés de 100%)
- Fade in/out com opacidade
- Transição tipo spring com stiffness/damping moderados

**Arquivo a modificar:** `src/components/conceitos/slides/ConceitoSlideCard.tsx`

---

## Implementação Técnica

### Arquivo 1: `ConceitosSlidesViewer.tsx`

Linha 41 - Trocar o hook `useSound` pelo áudio direto:
```typescript
// Remover: const [playPageFlip] = useSound('/sounds/page-flip.mp3', { volume: 0.3 });

// Adicionar ref para áudio (igual OABTrilhasReader):
const pageTurnAudioRef = useRef<HTMLAudioElement | null>(null);

useEffect(() => {
  const audio = new Audio('https://files.catbox.moe/g2jrb7.mp3');
  audio.volume = 0.4;
  audio.preload = 'auto';
  pageTurnAudioRef.current = audio;
  
  return () => { pageTurnAudioRef.current = null; };
}, []);

// Nas funções handleNext/handlePrevious/handleNavigate:
// Trocar playPageFlip() por:
if (pageTurnAudioRef.current) {
  pageTurnAudioRef.current.currentTime = 0;
  pageTurnAudioRef.current.play().catch(() => {});
}
```

### Arquivo 2: `ConceitoSlideCard.tsx`

Linhas 79-93 - Ajustar variantes de animação:
```typescript
const slideVariants = {
  enter: (direction: 'next' | 'prev') => ({
    x: direction === 'next' ? 80 : -80,
    opacity: 0
  }),
  center: {
    x: 0,
    opacity: 1
  },
  exit: (direction: 'next' | 'prev') => ({
    x: direction === 'next' ? -80 : 80,
    opacity: 0
  })
};
```

Linha 359-361 - Ajustar transição para spring mais suave:
```typescript
transition={{ 
  x: { type: "spring", stiffness: 300, damping: 30 },
  opacity: { duration: 0.2 }
}}
```

---

## Resultado Esperado

1. A transição entre páginas será mais fluida, com um deslocamento curto de 80px combinado com fade
2. O som será o mesmo usado na OAB Trilhas (som mais agradável e consistente)
3. A experiência será uniforme entre as duas áreas do app

