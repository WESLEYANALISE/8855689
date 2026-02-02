
# Plano: Ajustes no Progresso, Chat e Menu de Recursos

## Resumo dos Problemas Identificados

### Problema 1: Porcentagem em Tempo Real na Aula Interativa
**Arquivo**: `src/components/AulaArtigoSlidesViewer.tsx`

O loading state atual (linhas 250-302) mostra apenas:
- Ícone com bolinha girando
- Mensagens de texto rotativas
- Dots indicadores

**Falta**: Círculo de progresso com porcentagem (0-100%) como no `FlashcardsArtigoModal`

### Problema 2: Layout das Perguntas Sugeridas no Chat
**Arquivo**: `src/components/PerguntaModal.tsx`

As perguntas sugeridas estão em:
```tsx
<div className="grid grid-cols-2 gap-2">
```

Deveria ser uma embaixo da outra:
```tsx
<div className="flex flex-col gap-2">
```

### Problema 3: Flickering do Menu "Recursos do Artigo"
**Arquivo**: `src/components/ArtigoFullscreenDrawer.tsx`

O menu aparece/desaparece abruptamente sem animação, o que pode causar a sensação de "piscando". Falta usar `AnimatePresence` + `motion.div` para entrada/saída suave.

---

## Parte 1: Adicionar Porcentagem na Aula Interativa

### Mudança
Adicionar um estado de progresso simulado (similar ao FlashcardsArtigoModal) com:
- Círculo SVG animado mostrando 0-100%
- Progresso que avança realisticamente durante a geração
- Mensagens contextuais que mudam conforme o progresso

### Código Atual (Problema)
```tsx
{etapaAtual === 'loading' && (
  <div className="...">
    <Loader2 className="animate-spin" />
    <span>{loadingMessage}</span>
    {/* Apenas dots */}
    {loadingMessages.map((_, i) => (
      <div className={`w-2 h-2 rounded-full ${i <= loadingIndex ? 'bg-red-400' : 'bg-gray-700'}`} />
    ))}
  </div>
)}
```

### Código Novo
```tsx
{etapaAtual === 'loading' && (
  <div className="...">
    {/* Círculo de progresso com porcentagem */}
    <div className="relative w-28 h-28">
      <svg className="w-28 h-28 -rotate-90">
        <circle cx="56" cy="56" r="50" stroke="currentColor" strokeWidth="5" fill="none" className="text-gray-700" />
        <circle cx="56" cy="56" r="50" stroke="currentColor" strokeWidth="5" fill="none" 
          strokeDasharray={314.16} 
          strokeDashoffset={314.16 * (1 - progress / 100)} 
          className="text-red-500 transition-all duration-300" 
          strokeLinecap="round" 
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-3xl font-bold text-red-400">{progress}%</span>
      </div>
    </div>
    <span>{progressMessage}</span>
  </div>
)}
```

### Lógica de Progresso Realista
- **0-15%**: "Analisando o artigo..." (rápido)
- **15-35%**: "Criando estrutura da aula..." (médio)
- **35-55%**: "Gerando slides didáticos..." (lento - fase principal)
- **55-75%**: "Criando flashcards..." (médio)
- **75-90%**: "Montando questões..." (médio)
- **90-100%**: Quando API retorna (finalização)

---

## Parte 2: Layout Vertical das Perguntas Sugeridas

### Mudança
Trocar `grid grid-cols-2` por `flex flex-col` para as perguntas aparecerem empilhadas verticalmente.

### Arquivo
`src/components/PerguntaModal.tsx` - linha 484

### Código Atual (Problema)
```tsx
<div className="grid grid-cols-2 gap-2">
  {perguntasProntas.map((pergunta, idx) => (
    <button ...>
      {pergunta}
    </button>
  ))}
</div>
```

### Código Novo
```tsx
<div className="flex flex-col gap-2">
  {perguntasProntas.map((pergunta, idx) => (
    <button
      key={idx}
      onClick={() => enviarPergunta(pergunta)}
      disabled={loading}
      className="text-left px-3 py-2.5 rounded-lg bg-primary/5 hover:bg-primary/10 
        border border-primary/20 hover:border-primary/40 transition-all text-sm text-foreground"
    >
      {pergunta}
    </button>
  ))}
</div>
```

---

## Parte 3: Animação Suave no Menu de Recursos

### Mudança
Envolver o menu de recursos com `AnimatePresence` e usar `motion.div` com animações de slide-up e fade para eliminar o flickering.

### Arquivo
`src/components/ArtigoFullscreenDrawer.tsx` - linhas 1050-1119

### Código Atual (Problema)
```tsx
{showRecursos && (
  <div className="fixed inset-0 z-[55] ...">
    <div className="absolute inset-0 bg-black/60 ..." />
    <div className="relative w-full max-w-lg bg-card ...">
      {/* conteúdo */}
    </div>
  </div>
)}
```

### Código Novo
```tsx
<AnimatePresence>
  {showRecursos && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[55] flex items-end justify-center"
      onClick={(e) => e.stopPropagation()}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setShowRecursos(false)}
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-lg bg-card rounded-t-2xl p-4 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* conteúdo */}
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
```

---

## Arquivos a Modificar

1. **`src/components/AulaArtigoSlidesViewer.tsx`**
   - Adicionar estados: `progress`, `progressMessage`
   - Adicionar função `startProgressAnimation` no `fetchOrGenerateSlides`
   - Substituir loading state por círculo de progresso com porcentagem

2. **`src/components/PerguntaModal.tsx`**
   - Linha 484: Trocar `grid grid-cols-2` por `flex flex-col`
   - Ajustar estilo dos botões de sugestão

3. **`src/components/ArtigoFullscreenDrawer.tsx`**
   - Adicionar `motion` aos imports do framer-motion (já tem `AnimatePresence` via outros usos)
   - Envolver menu de recursos com `AnimatePresence` e `motion.div`
   - Adicionar animações de slide-up para o menu

---

## Detalhes Técnicos

### Progresso Simulado (similar ao FlashcardsArtigoModal)
```typescript
const [progress, setProgress] = useState(0);
const [progressMessage, setProgressMessage] = useState("Iniciando...");

// No fetchOrGenerateSlides
let currentProgress = 0;
const progressInterval = setInterval(() => {
  if (currentProgress < 85) {
    const increment = currentProgress < 20 ? 2 : currentProgress < 50 ? 1.5 : 1;
    currentProgress = Math.min(85, currentProgress + increment);
    setProgress(Math.round(currentProgress));
    
    // Mensagens contextuais
    if (currentProgress < 15) setProgressMessage("📖 Analisando o artigo...");
    else if (currentProgress < 35) setProgressMessage("🏗️ Criando estrutura...");
    else if (currentProgress < 55) setProgressMessage("✍️ Gerando slides...");
    else if (currentProgress < 75) setProgressMessage("🎴 Criando flashcards...");
    else setProgressMessage("✨ Finalizando...");
  }
}, 400);

// Quando API retorna
clearInterval(progressInterval);
setProgress(100);
setProgressMessage("✅ Concluído!");
```

### Animação do Menu (usando spring para suavidade)
```typescript
transition={{ 
  type: "spring", 
  damping: 25, 
  stiffness: 300 
}}
```

Este tipo de animação elimina o "piscando" porque:
1. O backdrop faz fade in/out suave
2. O menu desliza de baixo para cima com spring
3. O `AnimatePresence` garante que a animação de saída complete antes de remover o elemento
