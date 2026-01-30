
# Plano: Carregamento Instantâneo de Imagens com Cache Agressivo

## Objetivo
Implementar carregamento instantâneo com blur placeholder e cache agressivo para **todas** as imagens do app: capas de bibliotecas, capas de livros, imagens de fundo (backgrounds), e outras imagens críticas.

---

## Análise do Sistema Atual

### Componentes que JÁ usam UniversalImage (✅ OK)
- `BibliotecasCarousel` - capas das bibliotecas
- `CapaDocumentario` - capas de documentários
- `CachedImage` (wrapper)
- `EstudosPoliticosSection`

### Componentes que PRECISAM migrar para UniversalImage
1. **Capas de Livros**
   - `LivroCard.tsx` - lista de livros nas bibliotecas
   - `LivroCarouselCard.tsx` - carrossel de livros
   - `BookRecommendationCard.tsx` - recomendações de livros
   
2. **Imagens de Fundo (Backgrounds)**
   - `HeroBackground.tsx` - hero de várias páginas
   - Páginas com `backgroundImage` inline: `ConceitosLivro`, `ConceitosTrilhante`, `OABTrilhasMateria`, `FaculdadeInicio`, `BibliotecaClassicosAnalise`
   - `DesktopTopNav.tsx` - header desktop
   
3. **Outros Cards com Imagens**
   - `NoticiaCarouselCard.tsx` - notícias
   - `CursosAreasCarousel.tsx` - cursos
   - `FlashcardsEmAltaCarousel.tsx` - flashcards
   - `CarreirasCarousel.tsx` - carreiras
   - `ResumosDisponiveisCarousel.tsx` - resumos

---

## Implementação

### Fase 1: Melhorar HeroBackground com Blur Placeholder

```typescript
// HeroBackground.tsx - ANTES
<img
  src={imageSrc}
  loading="eager"
  fetchPriority="high"
  decoding="sync"
/>

// HeroBackground.tsx - DEPOIS
import { UniversalImage } from '@/components/ui/universal-image';
import type { BlurCategory } from '@/lib/blurPlaceholders';

interface HeroBackgroundProps {
  imageSrc: string;
  imageAlt?: string;
  height?: string;
  blurCategory?: BlurCategory;
  gradientOpacity?: {...};
}

<UniversalImage
  src={imageSrc}
  alt={imageAlt}
  priority={true}
  blurCategory={blurCategory}
  disableBlur={false}
  containerClassName="w-full h-full"
/>
```

### Fase 2: Migrar Cards de Livros

Atualizar `LivroCard.tsx`, `LivroCarouselCard.tsx` e `BookRecommendationCard.tsx` para usar `UniversalImage`:

```typescript
// LivroCard.tsx - Exemplo de migração
import { UniversalImage } from '@/components/ui/universal-image';

// ANTES
<img
  src={capaUrl}
  loading={isImagePreloaded(capaUrl) ? "eager" : "lazy"}
  decoding={isImagePreloaded(capaUrl) ? "sync" : "async"}
  onLoad={() => markImageLoaded(capaUrl)}
/>

// DEPOIS
<UniversalImage
  src={capaUrl}
  alt={titulo}
  priority={priority}
  blurCategory="library"
  containerClassName="w-full h-full"
/>
```

### Fase 3: Criar Componente InstantBackground para Fundos

Novo componente para backgrounds com estilo inline:

```typescript
// src/components/ui/instant-background.tsx
import { memo } from 'react';
import { UniversalImage } from './universal-image';
import type { BlurCategory } from '@/lib/blurPlaceholders';

interface InstantBackgroundProps {
  src: string;
  alt?: string;
  blurCategory?: BlurCategory;
  gradient?: string;
  className?: string;
}

export const InstantBackground = memo(({
  src,
  alt = '',
  blurCategory = 'dark',
  gradient = 'bg-gradient-to-b from-black/70 via-black/60 to-black/80',
  className = 'fixed inset-0'
}: InstantBackgroundProps) => {
  return (
    <>
      <div className={cn(className, 'pointer-events-none')}>
        <UniversalImage
          src={src}
          alt={alt}
          priority={true}
          blurCategory={blurCategory}
          disableBlur={false}
          containerClassName="w-full h-full"
        />
      </div>
      <div className={cn(className, gradient)} />
    </>
  );
});
```

### Fase 4: Migrar Carrosséis e Cards Restantes

Atualizar os seguintes componentes:
- `NoticiaCarouselCard.tsx` → usar UniversalImage com `blurCategory="news"`
- `CursosAreasCarousel.tsx` → usar UniversalImage
- `FlashcardsEmAltaCarousel.tsx` → usar UniversalImage
- `CarreirasCarousel.tsx` → usar UniversalImage
- `ResumosDisponiveisCarousel.tsx` → usar UniversalImage

### Fase 5: Ampliar Sistema de Preload

Melhorar `GlobalImagePreloader.tsx` para incluir mais categorias:

```typescript
// Adicionar ao CRITICAL_SUPABASE_IMAGES
{ key: 'livros_estudos_capas', table: 'BIBLIOTECA-ESTUDOS', imageColumn: 'url_capa_gerada', limit: 100 },
{ key: 'livros_classicos_capas', table: 'BIBLIOTECA-CLASSICOS', imageColumn: 'imagem', limit: 50 },
{ key: 'livros_oab_capas', table: 'BIBILIOTECA-OAB', imageColumn: 'Capa-livro', limit: 50 },
{ key: 'carreiras_capas', table: 'CARREIRAS_JURIDICAS', imageColumn: 'capa_url', limit: 20 },
```

### Fase 6: Adicionar Categorias de Blur ao Sistema

Expandir `blurPlaceholders.ts`:

```typescript
export const BLUR_PLACEHOLDERS = {
  // Existentes...
  
  // Novos para melhor matching
  book: 'data:image/webp;base64,...', // tom âmbar/marrom (capa de livro)
  career: 'data:image/webp;base64,...', // azul profissional
  course: 'data:image/webp;base64,...', // verde educacional
  flashcard: 'data:image/webp;base64,...', // roxo
  resume: 'data:image/webp;base64,...', // vermelho/laranja
} as const;
```

---

## Arquivos a Modificar

### Componentes UI
1. `src/components/HeroBackground.tsx` - Migrar para UniversalImage
2. `src/components/LivroCard.tsx` - Migrar para UniversalImage
3. `src/components/LivroCarouselCard.tsx` - Migrar para UniversalImage
4. `src/components/BookRecommendationCard.tsx` - Migrar para UniversalImage
5. `src/components/NoticiaCarouselCard.tsx` - Migrar para UniversalImage
6. `src/components/CursosAreasCarousel.tsx` - Migrar para UniversalImage
7. `src/components/FlashcardsEmAltaCarousel.tsx` - Migrar para UniversalImage
8. `src/components/CarreirasCarousel.tsx` - Migrar para UniversalImage
9. `src/components/ResumosDisponiveisCarousel.tsx` - Migrar para UniversalImage

### Páginas com Background
10. `src/pages/ConceitosLivro.tsx` - Usar InstantBackground
11. `src/pages/ConceitosTrilhante.tsx` - Usar InstantBackground
12. `src/pages/oab/OABTrilhasMateria.tsx` - Usar InstantBackground
13. `src/pages/FaculdadeInicio.tsx` - Usar InstantBackground
14. `src/pages/BibliotecaClassicosAnalise.tsx` - Usar InstantBackground
15. `src/components/DesktopTopNav.tsx` - Usar UniversalImage

### Novos Arquivos
16. `src/components/ui/instant-background.tsx` - Novo componente

### Sistema de Cache
17. `src/lib/blurPlaceholders.ts` - Adicionar novas categorias
18. `src/components/GlobalImagePreloader.tsx` - Expandir preload

---

## Benefícios Esperados

1. **Carregamento Instantâneo**: Blur placeholder visível imediatamente enquanto imagem real carrega
2. **Zero Layout Shift**: Container com aspect ratio fixo + blur evita "pulos" no layout
3. **Cache Agressivo**: Performance API + memória + preload = imagens já em cache na maioria das vezes
4. **UX Consistente**: Mesmo padrão visual em todo o app
5. **Performance**: Imagens prioritárias com fetchPriority="high" + decoding="sync"

---

## Detalhes Técnicos

### Como funciona o carregamento instantâneo:

```text
1. Container renderiza com backgroundColor de fallback (ex: #78350f para library)
2. Blur placeholder (10x10px base64) aparece com blur(20px) + scale(1.1)
3. Imagem real começa a carregar
4. Quando imagem carrega:
   - Blur faz transição: blur(0) + scale(1) + opacity(0)
   - Imagem real: opacity(0) → opacity(1)
5. Imagem marcada no cache global (Set + Performance API)
6. Próxima vez: imagem detectada no cache → loading="eager", sem blur
```

### Verificação de cache (ordem):
1. `Set<string>` em memória (mais rápido)
2. `performance.getEntriesByName()` - verifica cache HTTP do browser
3. `new Image().complete` - fallback para imagens já renderizadas
