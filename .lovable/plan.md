
# Redesign Completo da Area de Resumos Juridicos

## Problema Atual
A area de resumos juridicos possui multiplas paginas intermediarias com layout de "timeline" (cards alternados esquerda/direita com pegadas animadas) que funciona visualmente mas prejudica a navegacao rapida e a usabilidade no mobile. O fluxo atual exige 4 cliques ate chegar ao conteudo:
1. Landing (`/resumos-juridicos`) - escolha entre prontos/personalizados
2. Trilhas (`/resumos-juridicos/prontos`) - areas do direito em timeline
3. Temas (`/resumos-juridicos/prontos/:area`) - temas em timeline
4. View (`/resumos-juridicos/prontos/:area/:tema`) - conteudo

## Nova Abordagem: Hub Unificado de Acesso Rapido

Redesenhar para ser uma experiencia de consulta rapida, organizada e elegante, inspirada na referencia (lista com thumbnails numerados, busca e breadcrumbs).

### Estrutura Proposta

**Pagina 1 - Hub Principal (`/resumos-juridicos/prontos`)**
- Header compacto com titulo "Resumos Juridicos" e contador total
- Barra de busca global (pesquisa por area, tema ou subtema)
- Tabs: "Por Materia" | "Artigos de Lei" | "Personalizado"
- Na aba "Por Materia": lista vertical limpa com cards horizontais (thumbnail + nome da area + contagem), sem timeline
- Na aba "Artigos": categorias em lista (Constituicao, Codigos, etc.)
- Na aba "Personalizado": opcoes de texto, PDF, imagem

**Pagina 2 - Temas da Area (`/resumos-juridicos/prontos/:area`)**
- Breadcrumb: Resumos > [Area]
- Botao voltar compacto
- Barra de busca para filtrar temas
- Ordenacao (cronologica/alfabetica) em pills compactos
- Lista de temas em cards horizontais com: thumbnail, numero do tema (badge), titulo, contagem de resumos, chevron

**Pagina 3 - Subtemas (`/resumos-juridicos/prontos/:area/:tema`)** (mantem o layout existente da ResumosProntosView)

### Detalhes Tecnicos

**Arquivos a modificar:**
1. `src/pages/ResumosJuridicosEscolha.tsx` - Substituir por novo hub unificado
2. `src/pages/ResumosJuridicosTrilhas.tsx` - Pode ser removida/redirecionada, o hub ja exibe as areas
3. `src/pages/ResumosProntos.tsx` - Redesenhar com layout de lista limpa (inspirado na referencia)
4. `src/pages/ResumosJuridicosLanding.tsx` - Redirecionar para o hub unificado (eliminar pagina intermediaria)
5. `src/App.tsx` - Ajustar rota `/resumos-juridicos` para apontar direto ao hub

**Design dos Cards de Lista (mobile-first):**
- Card horizontal: `flex items-center gap-3`
- Thumbnail 60x60 com rounded-lg e fallback gradiente
- Badge numerica (01, 02...) posicionada sobre o thumbnail
- Titulo em `text-sm font-medium` com `line-clamp-2`
- Contagem em texto pequeno muted
- ChevronRight no final
- Hover/tap com scale sutil e borda highlight

**Busca Global:**
- Debounce de 300ms
- Pesquisa simultanea em areas + temas + subtemas
- Resultados agrupados por tipo com secoes colapsaveis

**Performance:**
- Substituir animacoes Framer Motion por CSS transitions leves
- Manter React Query com cache agressivo existente
- Lazy load das thumbnails com placeholder

**Paleta de cores:**
- Manter vermelho como cor principal do modulo
- Cards com `bg-card` e `border-border/50`
- Badges numericas em vermelho (`bg-red-600 text-white`)
- Fundo limpo sem imagem de background pesada

### Fluxo Simplificado Final
1. `/resumos-juridicos` redireciona para `/resumos-juridicos/prontos`
2. `/resumos-juridicos/prontos` - Hub com tabs (Materia/Artigos/Custom) e lista de areas
3. `/resumos-juridicos/prontos/:area` - Lista de temas com thumbnails
4. `/resumos-juridicos/prontos/:area/:tema` - Conteudo (mantem)

### Correcao do Build Error
O build error reportado parece ser apenas o output do build (nao um erro real - o log mostra modules transformados e assets). Sera verificado e corrigido se necessario durante a implementacao.
