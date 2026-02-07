
# Plano: Otimização de Carregamento de Imagens

## Problema Identificado
A imagem de fundo da "Jornada de Estudos" (`themis-estudos-desktop.webp`) demora a carregar porque **não tem preload no HTML**, diferente das imagens do Hero que carregam instantaneamente via `<link rel="preload">` no `index.html`.

---

## Correções Necessárias

### 1. Adicionar Preload da Imagem da Jornada de Estudos
**Arquivo:** `index.html`

Adicionar preload links para as imagens críticas da aba "Aprender" (Jornada de Estudos) e "OAB":

```html
<!-- Jornadas de Estudos e OAB - CRÍTICAS -->
<link rel="preload" href="/src/assets/themis-estudos-desktop.webp" as="image" type="image/webp" />
<link rel="preload" href="/src/assets/themis-estudos-background.webp" as="image" type="image/webp" />
<link rel="preload" href="/src/assets/oab-aprovacao-hero.webp" as="image" type="image/webp" />
```

### 2. Converter 12 Imagens JPG/PNG para WebP
Usar a edge function `converter-imagem-webp` ou TinyPNG para comprimir e converter:

| Arquivo Atual | Tamanho | Economia Esperada |
|---------------|---------|-------------------|
| `capa-pesquisa-cientifica.jpg` | 243 KB | ~60-70% |
| `estudos-background.jpg` | 233 KB | ~60-70% |
| `noticias-juridicas-bg.png` | 231 KB | ~70-80% |
| `biblioteca-office-sunset.jpg` | 214 KB | ~60-70% |
| `capa-portugues.jpg` | 190 KB | ~60-70% |
| `videoaulas-oab-background.jpg` | 182 KB | ~60-70% |
| `constituicao-background.jpg` | 175 KB | ~60-70% |
| `capa-oratoria.jpg` | 159 KB | ~60-70% |
| `tela-background.jpg` | 147 KB | ~60-70% |
| `capa-lideranca.jpg` | 51 KB | ~50-60% |
| `capa-fora-da-toga.jpg` | 49 KB | ~50-60% |
| `bg-praticar-exam.jpg` | 50 KB | ~50-60% |

### 3. Recomprimir Imagens WebP Muito Pesadas (>150KB)
Imagens WebP acima de 150KB devem ser redimensionadas ou recomprimidas:

- `hero-bibliotecas-office.webp` (250 KB → ~100 KB)
- `hero-sumulas.webp` (231 KB → ~100 KB)
- `hero-mapamental.webp` (221 KB → ~100 KB)
- Mais 12 imagens entre 150-210 KB

### 4. Mover Imagens Críticas para /public
Copiar as 3 imagens mais críticas para `/public` para preload mais eficiente:

```bash
# Copiar para public/
themis-estudos-desktop.webp → public/themis-estudos-desktop.webp
oab-aprovacao-hero.webp → public/oab-aprovacao-hero.webp
```

E atualizar o `Index.tsx` para usar paths de `/public`.

---

## Resumo das Ações

1. **Imediato**: Adicionar preloads no `index.html` para imagens da Jornada de Estudos
2. **Curto prazo**: Converter 12 arquivos JPG/PNG para WebP
3. **Médio prazo**: Recomprimir 15+ imagens WebP pesadas para <100KB
4. **Opcional**: Mover imagens críticas para `/public`

---

## Resultado Esperado

- Carregamento instantâneo da imagem de fundo da "Jornada de Estudos"
- Redução de ~1.5MB no bundle total de imagens
- Tempo de First Contentful Paint (FCP) reduzido
