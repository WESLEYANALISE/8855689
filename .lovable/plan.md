
## Ajustes na Pagina de Planos, Tutorial e Cards Flutuantes

### 1. Pagina Escolher Plano (`src/pages/EscolherPlano.tsx`)

**Layout vertical**: Trocar `grid-cols-2` por coluna unica (`flex flex-col`), com os cards empilhados (Gratuito em cima, Vitalicio embaixo).

**Capas nos dois cards**: Adicionar uma imagem de capa no topo de cada card, usando a imagem da deusa Themis vermelha (`themis-face-closeup` ou similar ja existente no projeto). O card gratuito tera uma versao com filtro mais escuro/dessaturado, e o vitalicio com destaque dourado.

**Remover mencoes a IA**: Trocar "Resumos com IA" por "Resumos inteligentes" e "Noticias + Analise IA" por "Noticias + Analise" nas listas de features.

**Manter "Ver mais"**: O componente FeatureList com botao "Ver mais" continua funcionando em ambos os cards.

### 2. Tutorial IntroCarousel (`src/components/onboarding/IntroCarousel.tsx`)

**Slide "Ferramentas inteligentes de estudo"** (slide 2): Trocar a feature "Resumos com IA" por "Resumos inteligentes" na lista de features.

### 3. Remover Cards Flutuantes (`src/components/Layout.tsx`)

**Remover completamente**:
- A renderizacao do `PremiumWelcomeCard`
- A renderizacao do `RateAppFloatingCard`
- Os imports correspondentes

Os arquivos dos componentes em si serao mantidos no projeto (nao deletados), apenas removidos do Layout.

### 4. Corrigir erro de build

O erro de build mencionado sera resolvido com as edicoes acima, ja que as mudancas nao introduzem novos problemas.

### Detalhes Tecnicos

```text
Arquivos modificados:
1. src/pages/EscolherPlano.tsx
   - grid-cols-2 → flex flex-col gap-4
   - Adicionar imagem de capa (themis) no topo de cada card
   - max-w-md mx-auto para centralizar os cards
   - Trocar "Resumos com IA" → "Resumos inteligentes"
   - Trocar "Noticias + Analise IA" → "Noticias + Analise"

2. src/components/onboarding/IntroCarousel.tsx
   - features slide 2: "Resumos com IA" → "Resumos inteligentes"

3. src/components/Layout.tsx
   - Remover imports de PremiumWelcomeCard e RateAppFloatingCard
   - Remover renderizacao dos dois componentes (linhas 575-579)
```

As capas usarao uma imagem existente do projeto (themis-face-closeup ou similar) com aspect-ratio 16:9, aplicada via tag img com object-cover no topo de cada card.
