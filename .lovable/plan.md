

# Aplicar Sistema de Niveis nas Trilhas OAB e Conceitos

## Resumo

Aplicar a mesma mecanica de niveis (serpentina circular com banners coloridos, barra de progresso, porcentagem na capa) que ja existe em `AreaTrilhaPage.tsx` nas paginas **TrilhasAprovacao** (OAB) e **ConceitosTrilhante** (Conceitos).

## Paginas a modificar

### 1. TrilhasAprovacao (`src/pages/oab/TrilhasAprovacao.tsx`)
- **Atual**: Timeline alternada esquerda/direita com cards retangulares
- **Novo**: Serpentina circular com niveis, identica a AreaTrilhaPage
- As materias (areas da OAB como Administrativo, Trabalho, etc.) serao divididas em ate 10 niveis
- Cada nivel tera banner colorido com linhas laterais
- Cada materia sera um circulo com capa, badge de ordem, porcentagem dentro, e animacao pulsante no atual
- Barra de progresso geral no topo com indicadores de nivel
- Manter paleta vermelha (tema OAB)

### 2. ConceitosTrilhante (`src/pages/ConceitosTrilhante.tsx`)
- **Atual**: Timeline alternada esquerda/direita com cards retangulares
- **Novo**: Serpentina circular com niveis, identica a AreaTrilhaPage
- As materias de Conceitos serao divididas em ate 10 niveis
- Mesma mecanica visual: circulos, banners, progresso, animacao
- Manter paleta ambar/laranja (tema Conceitos)

## Detalhes Tecnicos

### Componente reutilizavel
Extrair a logica de serpentina com niveis de `AreaTrilhaPage.tsx` para um componente compartilhado `SerpentineNiveis` que receba:
- `items`: lista de itens (materias)
- `getItemCapa(item)`: funcao para obter URL da capa
- `getItemTitulo(item)`: funcao para obter titulo
- `getItemOrdem(item)`: funcao para obter ordem
- `getItemAulas(item)`: funcao para obter contagem de aulas
- `getItemProgresso(item)`: funcao para obter progresso (%)
- `onItemClick(item)`: callback de navegacao
- `colorTheme`: "red" | "amber" | "green" (para adaptar cores por modulo)

### Constantes compartilhadas
- `SERPENTINE_X`, `NODE_SIZE`, `CURRENT_NODE_SIZE`, `VERTICAL_SPACING`, `CONTAINER_WIDTH`, `TOTAL_NIVEIS`
- `NIVEL_COLORS` (mesma paleta de 10 cores para todos os modulos)
- `NivelBanner` (componente de banner com linhas laterais)

### Arquivos a criar/modificar
1. **Criar** `src/components/shared/SerpentineNiveis.tsx` - Componente reutilizavel extraido de AreaTrilhaPage
2. **Modificar** `src/pages/AreaTrilhaPage.tsx` - Importar e usar o componente compartilhado
3. **Modificar** `src/pages/oab/TrilhasAprovacao.tsx` - Substituir timeline por SerpentineNiveis
4. **Modificar** `src/pages/ConceitosTrilhante.tsx` - Substituir timeline por SerpentineNiveis

### Correcao de build
Tambem corrigir o erro de build existente no AreaTrilhaPage.tsx (se houver).

### Tratamento Premium
- Em TrilhasAprovacao: manter verificacao Premium antes de navegar
- Em ConceitosTrilhante: materias gratuitas ficam normais, premium ficam com icone de cadeado no circulo e overlay escurecido

