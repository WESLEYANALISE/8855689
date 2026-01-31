
# Plano: Corrigir Piscadas Brancas no Mobile

## Diagnóstico

Após análise do codebase, identifiquei **múltiplas causas** para o problema de piscadas brancas no mobile:

### 1. Animações com `opacity: 0` inicial (Causa Principal)
- **149 arquivos** usam `initial={{ opacity: 0 }}` com framer-motion
- Quando um componente monta com `opacity: 0`, há um frame onde o background (branco do navegador) fica visível antes da animação começar
- Em mobile, a renderização é mais lenta, tornando esse flash mais perceptível

### 2. `AnimatePresence mode="wait"` causando gaps brancos
- Múltiplos componentes usam `AnimatePresence mode="wait"`
- O modo "wait" desmonta o componente antigo ANTES de montar o novo
- Durante esse intervalo, o background aparece (flash branco)

### 3. Transições de slides horizontais com `x: 300` e `opacity: 0`
- `ConceitoSlideCard.tsx` usa animação que move 300px horizontalmente com opacity 0
- Durante a transição, há um momento onde nada é renderizado

### 4. Falta de background escuro fixo no root
- O `html` e `body` têm background definido, mas durante transições React, o container pode piscar

---

## Solução

### Parte 1: CSS - Garantir Background Escuro Durante Transições

**Arquivo: `src/index.css`**

Adicionar regras para prevenir flash branco:
```css
/* Prevenir flash branco durante transições */
html, body, #root {
  background-color: hsl(0, 0%, 8%) !important;
}

/* Garantir que AnimatePresence não mostre background branco */
[data-motion-pop-id],
.framer-motion-container {
  background-color: inherit;
}

/* Forçar background em elementos com opacity animada */
.motion-opacity-container {
  background-color: hsl(0, 0%, 8%);
}
```

### Parte 2: Otimizar AnimatePresence em Componentes Críticos

**Arquivo: `src/components/conceitos/slides/ConceitosSlidesViewer.tsx`**

Mudar de `mode="wait"` para `mode="popLayout"` (mais suave):
```tsx
<AnimatePresence mode="popLayout" custom={direction}>
```

**Arquivo: `src/components/conceitos/slides/ConceitoSlideCard.tsx`**

Remover o `opacity: 0` inicial e usar apenas transformação:
```tsx
const slideVariants = {
  enter: (direction: 'next' | 'prev') => ({
    x: direction === 'next' ? 300 : -300,
    opacity: 0.3  // Nunca ir para 0 total
  }),
  center: {
    x: 0,
    opacity: 1
  },
  exit: (direction: 'next' | 'prev') => ({
    x: direction === 'next' ? -300 : 300,
    opacity: 0.3  // Manter visibilidade mínima
  })
};
```

### Parte 3: Otimizar Animações de Entrada nas Páginas Principais

**Arquivo: `src/components/conceitos/slides/ConceitosTopicoIntro.tsx`**

Substituir `opacity: 0` inicial por `opacity: 0.8`:
```tsx
<motion.div 
  initial={{ opacity: 0.8 }}  // Não mais 0
  animate={{ opacity: 1 }}
  className="..."
>
```

### Parte 4: Adicionar Background Explícito nos Containers de Animação

**Arquivo: `src/pages/ConceitosTopicoEstudo.tsx`**

Garantir que o container sempre tenha background:
```tsx
<div className="min-h-screen bg-background flex flex-col" 
     style={{ backgroundColor: 'hsl(0, 0%, 8%)' }}>
```

### Parte 5: Melhorar Transições de Lista

**Arquivo: `src/pages/ConceitosMateria.tsx`**

Reduzir delay stagger e remover opacity 0:
```tsx
<motion.button
  initial={{ opacity: 0.9, y: 5 }}  // Valores mínimos
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: index * 0.02 }}  // Delay reduzido
```

### Parte 6: Handler Global de Unhandled Rejections

**Arquivo: `src/App.tsx`**

Adicionar proteção contra erros async que causam tela branca:
```tsx
useEffect(() => {
  const handleRejection = (event: PromiseRejectionEvent) => {
    console.error("Unhandled rejection:", event.reason);
    event.preventDefault();  // Previne crash
  };
  window.addEventListener("unhandledrejection", handleRejection);
  return () => window.removeEventListener("unhandledrejection", handleRejection);
}, []);
```

---

## Arquivos que Serão Modificados

1. `src/index.css` - Adicionar regras CSS anti-flash
2. `src/components/conceitos/slides/ConceitosSlidesViewer.tsx` - Otimizar AnimatePresence
3. `src/components/conceitos/slides/ConceitoSlideCard.tsx` - Suavizar transições
4. `src/components/conceitos/slides/ConceitosTopicoIntro.tsx` - Remover opacity 0
5. `src/pages/ConceitosTopicoEstudo.tsx` - Background explícito
6. `src/pages/ConceitosMateria.tsx` - Otimizar lista animada
7. `src/App.tsx` - Handler de erros globais

---

## Resultado Esperado

- Eliminar flashes brancos durante navegação entre páginas
- Transições mais suaves entre slides
- Experiência mobile sem piscadas visuais
- App mais estável contra erros assíncronos
