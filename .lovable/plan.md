

## Carrossel de Boas-Vindas para Novos Usuarios

### O que sera criado

Um carrossel fullscreen com 6 slides animados que aparece **apenas na primeira vez** que o usuario acessa o app (apos o onboarding de perfil). Cada slide tera uma imagem de fundo tematica, titulo persuasivo, descricao curta e animacoes suaves. O ultimo slide apresenta a Evelyn (assistente IA no WhatsApp).

### Estrutura dos 6 slides

| Slide | Tema | Imagem de fundo | Conteudo |
|---|---|---|---|
| 1 | Boas-vindas | `capa-faculdade-opt.webp` | "Sua jornada juridica comeca agora" - Apresentacao do Direito Premium como plataforma completa |
| 2 | Ferramentas de Estudo | `estudos-section.webp` | Flashcards, Mapas Mentais, Resumos IA, Dicionario Juridico |
| 3 | Videoaulas e OAB | `oab-section.webp` | Videoaulas, Trilhas OAB, Questoes comentadas |
| 4 | Biblioteca e Vade Mecum | `biblioteca-section-opt.webp` | Acervo juridico, legislacao atualizada, sumulas |
| 5 | Questoes e Simulados | `concurso-section.webp` | Banco de questoes, simulados OAB, pratica diaria |
| 6 | Evelyn - IA no WhatsApp | `evelyn-ai-section.webp` | Assistente juridica 24h, tira duvidas, ajuda nos estudos |

### Como vai funcionar

1. Apos o onboarding (selecao de perfil), o usuario e redirecionado para `/` (Home)
2. Na Home, um check no `localStorage` verifica se `intro_carousel_seen_{userId}` existe
3. Se nao existir, exibe o carrossel fullscreen com overlay escuro
4. O usuario navega com swipe/botoes entre os slides
5. No ultimo slide, o botao "Comecar a Usar" fecha o carrossel e marca como visto no localStorage
6. O usuario pode pular a qualquer momento com "Pular" no canto superior

### Detalhes Tecnicos

**Novo componente: `src/components/onboarding/IntroCarousel.tsx`**
- Carrossel fullscreen usando `framer-motion` para animacoes de transicao entre slides
- Cada slide: imagem de fundo com `object-cover`, overlay gradiente escuro, conteudo centralizado
- Indicadores de progresso (dots) na parte inferior
- Botao "Pular" no topo direito
- Botao "Proximo" / "Comecar a Usar" (ultimo slide)
- Suporte a swipe com drag do framer-motion
- Controle via `localStorage` com chave `intro_carousel_seen_{userId}`
- Utiliza imagens ja existentes em `src/assets/landing/`

**Arquivo modificado: `src/pages/Index.tsx`**
- Importar `IntroCarousel`
- Adicionar estado `showIntro` baseado no localStorage
- Renderizar o carrossel como overlay quando `showIntro === true`
- Callback `onComplete` para fechar e marcar como visto

### Design Visual

- Fundo: imagem fullscreen com blur leve + overlay escuro (70%)
- Texto: branco, titulos grandes (text-3xl bold), descricoes em text-lg com opacidade
- Icones tematicos para cada slide (lucide-react)
- Animacao de entrada: fade + slide de baixo para cima
- Transicao entre slides: slide horizontal com framer-motion
- Dots de progresso com cor primaria (vermelho)
- CTA final com gradiente vermelho e animacao pulsante

