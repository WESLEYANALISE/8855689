

# Plano: Expandir Imagens para Cobrir Bordas Brancas

## Problema Identificado

As capas de subtemas OAB estão sendo geradas em **1280x720 pixels (16:9)**, mas o modelo Gemini às vezes inclui bordas brancas nas laterais. Essas bordas aparecem tanto na lista de subtemas quanto na tela de introdução.

## Solução

Aplicar técnica de **scale + crop** via CSS para expandir levemente a imagem além do container, efetivamente "cortando" qualquer borda branca que possa existir nas extremidades.

## Alterações Técnicas

### 1. Lista de Subtemas (`src/pages/oab/OABTrilhasTopicos.tsx`)

**Linha 295 - Thumbnail na lista:**
```tsx
// De:
className="w-full h-full object-cover"

// Para:
className="w-full h-full object-cover scale-110"
```

O `scale-110` aumenta a imagem em 10%, e como o container tem `overflow-hidden`, as bordas brancas ficam fora da área visível.

### 2. Tela de Introdução (`src/components/oab/OABTrilhasTopicoIntro.tsx`)

**Linhas 95-108 - Capa hero:**
```tsx
// De:
<UniversalImage
  ...
  className="object-cover"
/>

// Para:
<UniversalImage
  ...
  className="object-cover scale-110"
/>
```

### 3. Componente UniversalImage (opcional)

O componente `UniversalImage` já aplica `object-cover` internamente (linha 213). A classe adicional `scale-110` passada via `className` será concatenada corretamente.

## Detalhes Técnicos

| Aspecto | Valor Atual | Ação |
|---------|-------------|------|
| Resolução de geração | 1280x720 (16:9) | Manter |
| Técnica CSS | `object-cover` | Adicionar `scale-110` |
| Overflow | `overflow-hidden` | Já existe nos containers |

## Arquivos a Modificar

1. `src/pages/oab/OABTrilhasTopicos.tsx` - Adicionar scale nas thumbnails da lista
2. `src/components/oab/OABTrilhasTopicoIntro.tsx` - Adicionar scale na imagem hero

## Resultado Esperado

As imagens vão aparecer levemente ampliadas (10%), cortando automaticamente qualquer borda branca que o modelo de IA tenha gerado nas extremidades, sem perder qualidade visual significativa.

