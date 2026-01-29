# PRD - Timeline Vertical Responsiva

## Visão Geral

Este documento descreve o padrão de design e implementação para páginas com timeline vertical curva, usado nas páginas de **Bibliotecas** e **Legislação**. Serve como referência para criar novas páginas com o mesmo estilo visual.

---

## Estrutura Visual

### Layout Geral

```
┌─────────────────────────────────────┐
│  Header Fixo (botão voltar)         │ ← z-30, fixed top
├─────────────────────────────────────┤
│  Header Estilizado                  │ ← Ícone + Título + Descrição
│  (bg blur, rounded-2xl)             │
├─────────────────────────────────────┤
│                                     │
│     ┌─────────┐                     │
│     │ Card 1  │●────────┐           │ ← Cards alternando esquerda/direita
│     └─────────┘         │           │
│                    ┌────┴────┐      │
│                    │ Card 2  │●     │
│                    └─────────┘      │
│     ┌─────────┐         │           │
│     │ Card 3  │●────────┘           │
│     └─────────┘                     │
│                                     │
└─────────────────────────────────────┘
```

### Componentes Principais

1. **Background Fixo** - Imagem de fundo com gradiente overlay
2. **Header Fixo** - Botão voltar no topo
3. **Header Estilizado** - Título da seção com ícone
4. **SVG Timeline** - Linha curva com luzes animadas
5. **Cards** - Itens clicáveis com altura fixa

---

## Especificações Técnicas

### 1. Background Fixo

```tsx
<div className="fixed inset-0 z-0">
  <img
    src={backgroundImage}
    alt="Descrição"
    className="w-full h-full object-cover opacity-60"
    loading="eager"
    fetchPriority="high"
    decoding="sync"
  />
  <div 
    className="absolute inset-0"
    style={{
      background: `linear-gradient(
        to bottom,
        hsl(var(--background) / 0) 0%,
        hsl(var(--background) / 0.15) 40%,
        hsl(var(--background) / 0.4) 70%,
        hsl(var(--background) / 0.85) 100%
      )`
    }}
  />
</div>
```

**Características:**
- `fixed inset-0` para cobrir toda a tela
- `opacity-60` para não competir com o conteúdo
- Gradiente vai de transparente (topo) a quase opaco (base)
- Usar `loading="eager"` e `fetchPriority="high"` para carregamento rápido
- **IMPORTANTE**: Adicionar a imagem no `GlobalImagePreloader.tsx` na lista `SUPER_CRITICAL_IMAGES` para carregamento instantâneo

---

### 2. Header Fixo (Botão Voltar)

```tsx
<div className="fixed top-0 left-0 right-0 z-30 bg-card/95 backdrop-blur-md px-4 py-3 flex items-center gap-3 border-b border-border/30">
  <button
    onClick={() => navigate(-1)}
    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
  >
    <ChevronRight className="w-5 h-5 rotate-180" />
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">VOLTAR</span>
      <span className="text-sm font-medium text-foreground">Início</span>
    </div>
  </button>
</div>
```

**Características:**
- `z-30` para ficar acima de tudo
- `backdrop-blur-md` para efeito glassmorphism
- Ícone `ChevronRight` rotacionado 180°

---

### 3. Header Estilizado

```tsx
<div className="px-4 pt-16 pb-4">
  <div className="mx-auto max-w-sm">
    <div className="bg-background/40 backdrop-blur-md rounded-2xl px-5 py-4 border border-white/10">
      <div className="flex items-center gap-4">
        <div className="bg-accent/20 rounded-xl p-3 flex-shrink-0">
          <IconComponent className="w-8 h-8 text-accent" />
        </div>
        <div className="text-left">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground drop-shadow-lg">
            Título da Página
          </h1>
          <p className="text-white/90 text-xs sm:text-sm mt-1 drop-shadow-md">
            Descrição breve
          </p>
        </div>
      </div>
    </div>
  </div>
</div>
```

**Características:**
- `pt-16` para compensar o header fixo
- `max-w-sm` para largura máxima consistente
- Ícone com fundo colorido à esquerda

---

### 4. SVG Timeline Curva

```tsx
<svg 
  className="absolute left-0 top-0 w-full h-full pointer-events-none"
  viewBox="0 0 400 [ALTURA_DINAMICA]"
  preserveAspectRatio="none"
  style={{ zIndex: 0 }}
>
  <defs>
    {/* Gradiente com cores dos cards */}
    <linearGradient id="timelineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#COR1" />
      <stop offset="20%" stopColor="#COR2" />
      {/* ... mais cores ... */}
    </linearGradient>
    
    {/* Filtro de glow */}
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  {/* Linha curva */}
  <path
    d="M 50 30 
       Q 350 30, 350 150
       Q 350 270, 50 270
       ..."
    fill="none"
    stroke="url(#timelineGradient)"
    strokeWidth="3"
    strokeDasharray="8 4"
    className="opacity-60"
  />
  
  {/* Luz animada 1 */}
  <circle r="6" fill="white" filter="url(#glow)">
    <animateMotion dur="5s" repeatCount="indefinite" path="..." />
    <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
  </circle>
  
  {/* Luz animada 2 (com delay) */}
  <circle r="4" fill="#COR_PRIMARIA" filter="url(#glow)">
    <animateMotion dur="5s" repeatCount="indefinite" begin="2.5s" path="..." />
    <animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite" />
  </circle>
</svg>
```

**Fórmula do Path para N cards:**
```
Altura do viewBox = 30 + (N * 150) - 30
Cada curva serpenteia: esquerda → direita → esquerda...

Para 6 cards (Bibliotecas):
viewBox="0 0 400 900"

Para 8 cards (Legislação):
viewBox="0 0 400 1200"
```

**Padrão do Path:**
```
M 50 30                    // Ponto inicial (esquerda)
Q 350 30, 350 150          // Curva para direita
Q 350 270, 50 270          // Curva para esquerda
Q -50 270, 50 390          // Continua esquerda
Q 350 390, 350 510         // Curva para direita
...
```

---

### 5. Cards da Timeline

```tsx
<div
  onClick={() => handleClick(item)}
  className={`
    w-[80%] sm:w-[65%]
    bg-card
    rounded-2xl p-3
    border-2 border-border/50
    cursor-pointer
    hover:scale-[1.02] hover:shadow-2xl
    transition-all duration-300
    relative overflow-hidden
    shadow-xl
    group
    h-[90px]
  `}
  style={{
    borderLeftColor: isEven ? item.color : undefined,
    borderLeftWidth: isEven ? '4px' : undefined,
    borderRightColor: !isEven ? item.color : undefined,
    borderRightWidth: !isEven ? '4px' : undefined,
  }}
>
  {/* Glow effect */}
  <div 
    className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl opacity-40 group-hover:opacity-70"
    style={{ backgroundColor: item.color }}
  />
  
  {/* Conteúdo */}
  <div className="relative z-10 flex items-center gap-3 h-full">
    {/* Thumbnail/Ícone */}
    <div className="relative w-14 h-16 rounded-xl overflow-hidden flex-shrink-0">
      {/* Imagem ou ícone com shimmer */}
    </div>
    
    {/* Info */}
    <div className="flex-1 min-w-0 flex flex-col justify-center">
      <h3 className="text-sm sm:text-base font-bold">Título</h3>
      <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2">Descrição</p>
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full w-fit mt-1"
        style={{ backgroundColor: `${item.color}20`, color: item.color }}>
        Badge
      </span>
    </div>
    
    {/* Seta */}
    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
  </div>
  
  {/* Dot indicator */}
  <div 
    className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-background
      ${isEven ? '-right-2' : '-left-2'}`}
    style={{ 
      backgroundColor: item.color,
      boxShadow: `0 0 10px ${item.color}, 0 0 20px ${item.color}40`
    }}
  />
</div>
```

**Características:**
- `h-[90px]` altura fixa para consistência
- `w-[80%] sm:w-[65%]` responsivo
- `bg-card` fundo sólido (sem transparência)
- `border-border/50` borda semi-transparente do design system
- Borda colorida no lado da timeline (esquerda para ímpares, direita para pares)
- Dot indicator com glow no ponto de conexão

---

### 6. Animações CSS

```css
@keyframes shimmer {
  0%, 100% { opacity: 0; transform: translateX(-100%); }
  50% { opacity: 0.5; transform: translateX(100%); }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**Aplicação nos cards:**
```tsx
style={{ 
  opacity: 0,
  transform: 'translateY(-20px)',
  animation: `slideDown 0.5s ease-out ${index * 0.1}s forwards`
}}
```

---

## Estrutura de Dados do Card

```typescript
interface TimelineCard {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  iconBg: string;           // ex: "bg-emerald-500"
  color: string;            // ex: "#10b981"
  path: string;             // rota de navegação
  // Campos opcionais:
  thumbnailUrl?: string;    // imagem de capa
  badge?: string;           // texto do badge
  count?: number;           // contador
}
```

---

## Checklist de Implementação

- [ ] Importar imagem de background (9:16 para mobile)
- [ ] Definir array de cards com cores e ícones
- [ ] Calcular viewBox do SVG baseado no número de cards
- [ ] Criar gradiente com cores dos cards
- [ ] Definir path curvo para timeline
- [ ] Implementar duas luzes animadas
- [ ] Cards com altura fixa e largura responsiva
- [ ] Animação de entrada sequencial (delay por index)
- [ ] Shimmer effect nas thumbnails
- [ ] Dot indicator com glow
- [ ] Borda colorida alternando lados

---

## Exemplos de Uso

### Páginas que usam este padrão:
1. `/bibliotecas` - src/pages/Bibliotecas.tsx
2. `/legislacao` - src/components/PesquisaLegislacaoTimeline.tsx
3. `/blogger-juridico` - src/components/BlogJuridicoTimeline.tsx

### Para criar nova página:
1. Copiar estrutura de `Bibliotecas.tsx`
2. Substituir dados do array de cards
3. Ajustar cores no gradiente do SVG
4. Ajustar altura do viewBox baseado no número de cards
5. Ajustar o path da timeline

---

## Métricas de Performance

- **Imagem de fundo**: usar formato `.webp`, dimensão 1080x1920
- **Loading**: `eager` + `fetchPriority="high"`
- **Preload**: adicionar imagem no `GlobalImagePreloader.tsx` na lista `SUPER_CRITICAL_IMAGES`
- **Cache de imagem**: verificar `img.complete` antes de mostrar
- **Animações**: usar `animation-delay` progressivo (0.1s por card)

---

## Arquivos Relacionados

- **GlobalImagePreloader.tsx**: `src/components/GlobalImagePreloader.tsx` - Adicionar imagens hero aqui para carregamento instantâneo
- **Bibliotecas**: `src/pages/Bibliotecas.tsx` - Implementação de referência
- **Imagem atual Bibliotecas**: `src/assets/hero-bibliotecas-office.webp`

---

*Última atualização: Dezembro 2024*
