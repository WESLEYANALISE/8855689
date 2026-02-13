

# Plano de Otimizacao de Imagens para Carregamento Instantaneo

## Diagnostico Atual

Apos analisar o projeto, identifiquei a infraestrutura existente e os gargalos:

**O que ja funciona bem:**
- Sistema de blur placeholders (10x10px WebP base64) para transicao suave
- GlobalImagePreloader com preload de ~30 imagens criticas via `<link rel="preload">`
- Cache em memoria + IndexedDB (useInstantCache)
- UniversalImage com loading lazy/eager e fetchPriority
- Edge function para comprimir via TinyPNG

**Problemas identificados:**
1. **22+ imagens ainda em JPG/PNG** no bundle (nao convertidas para WebP) - muito mais pesadas
2. **welcome-1.png com 514KB** - maior asset do projeto
3. **noticias-juridicas-bg.png com 231KB** - deveria ser WebP
4. **Imagens JPG grandes**: constituicao-background.jpg (175KB), biblioteca-office-sunset.jpg (214KB), estudos-background.jpg (233KB), videoaulas-oab-background.jpg (181KB)
5. **6 imagens PNG de categorias** (tribunais, cartorios, etc.) que poderiam ser WebP
6. **3 politicos em PNG** (~21-29KB cada) desnecessariamente grandes
7. **Preload excessivo** - 22 imagens super criticas no preload competem por bandwidth, atrasando todas

---

## Plano de Otimizacao (3 Etapas)

### Etapa 1: Converter Assets Estaticos JPG/PNG para WebP

Converter manualmente os maiores ofensores para WebP, reduzindo o bundle em ~40-60%:

| Arquivo | Tamanho Atual | Estimativa WebP |
|---------|--------------|-----------------|
| welcome-1.png | 515KB | ~100KB |
| noticias-juridicas-bg.png | 231KB | ~50KB |
| estudos-background.jpg | 233KB | ~60KB |
| biblioteca-office-sunset.jpg | 214KB | ~55KB |
| constituicao-background.jpg | 176KB | ~45KB |
| videoaulas-oab-background.jpg | 182KB | ~50KB |
| capa-oratoria.jpg | 159KB | ~40KB |
| capa-pesquisa-cientifica.jpg | 243KB | ~60KB |
| bg-praticar-exam.jpg | 50KB | ~15KB |
| tela-background.jpg | 147KB | ~40KB |

**Acao:** Usar a edge function `comprimir-imagens-existentes` para imagens do Supabase, e para assets locais, adicionar conversao no pipeline ou substituir os arquivos por versoes WebP.

Atualizar todos os imports nos 92 arquivos que referenciam esses assets.

### Etapa 2: Otimizar Estrategia de Preload

O GlobalImagePreloader atual tenta precarregar 22 imagens com `fetchPriority="high"` simultaneamente, o que satura a banda e atrasa tudo.

**Mudancas:**
- **Tier 1 (3-4 imagens max):** Apenas as imagens da tela atual (hero banner da home + background da tab ativa). Preload via `<link rel="preload">` com `fetchPriority="high"`
- **Tier 2 (10-15 imagens):** Capas de bibliotecas, politicos, jornadas. Preload via `new Image()` em `requestIdleCallback` 
- **Tier 3 (resto):** Imagens de paginas secundarias. Preload lazy apos 3 segundos ou quando ocioso

### Etapa 3: Reduzir Tamanho dos Assets Locais Restantes

- Comprimir as **6 imagens de categorias PNG** (tribunais, cartorios, oab, escritorios, museus, todos) para WebP - de ~12-19KB cada para ~5-8KB
- Comprimir os **3 politicos PNG** para WebP
- Comprimir **onboarding images** (3 JPGs de ~100KB cada) para WebP (~30KB cada)
- Converter **brasao-republica.png** (33KB) para WebP

---

## Detalhes Tecnicos

### Arquivos a modificar:

1. **Converter ~20 assets** de JPG/PNG para WebP no diretorio `src/assets/`
2. **`src/components/GlobalImagePreloader.tsx`** - Reestruturar em 3 tiers de prioridade, limitar preload links a 4 imagens max
3. **~30+ arquivos de componentes/paginas** - Atualizar imports de `.jpg`/`.png` para `.webp`
4. **`src/lib/imageOptimizer.ts`** - Adicionar quality=75 como default (de 80) para Supabase transforms
5. **`index.html`** - Mover preload das 3-4 imagens mais criticas para o HTML estatico (carregamento antes do JS)

### Estimativa de reducao:
- **Bundle de imagens atual:** ~8.5MB total
- **Apos otimizacao:** ~3.5-4MB (reducao de ~50-55%)
- **Tempo de carregamento:** Reducao significativa pois menos bytes para baixar e preload mais inteligente

