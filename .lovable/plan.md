

## Aba "Aulas" - Layout Profissional com Dashboard

### Nova Estrutura Visual

```text
+----------------------------------+
|  DASHBOARD DE PROGRESSO          |
|  +---+ +---+ +---+              |
|  |Aul| |Aul| |Aul|  (carrossel) |
|  |a 1| |a 2| |a 3|              |
|  |45%| |20%| |70%|              |
|  +---+ +---+ +---+              |
|           Ver tudo >             |
+----------------------------------+
|                                  |
|  JORNADA DE ESTUDOS              |
|  Fundamentos do Direito          |
|                                  |
|  -- OAB --                       |
|  +-------------+  +------------+ |
|  | 1a Fase     |  | 2a Fase    | |
|  +-------------+  +------------+ |
|                                  |
|  +-------------+  +------------+ |
|  | Trilha de   |  | Iniciando  | |
|  | Conceitos   |  | Concursos  | |
|  +-------------+  +------------+ |
|                                  |
|  +-------------+                 |
|  | Portugues   |                 |
|  +-------------+                 |
|                                  |
|  -- Areas do Direito --          |
|  +---+ +---+ +---+ (carrossel)  |
|  |Con| |Civ| |Pen|              |
|  +---+ +---+ +---+              |
+----------------------------------+
```

### Detalhes de Cada Secao

**1. Dashboard de Progresso (topo)**
- Cards em carrossel horizontal com as aulas em andamento do usuario
- Cada card mostra: nome da aula/topico, area/materia, barra de progresso, porcentagem
- Estilo escuro premium com sombras profundas e gradientes
- Botao "Ver tudo" que navega para uma nova pagina `/aulas/dashboard`
- Se nao houver progresso, mostra estado vazio com mensagem motivacional

**2. Pagina Dashboard Completa (`/aulas/dashboard`)**
- Nova pagina dedicada mostrando todos os topicos/aulas em andamento
- Cada item mostra detalhes: titulo, area, materia, progresso de leitura/flashcards/questoes
- Ao clicar em um item, navega para a aula correspondente
- Botao voltar retorna para `/?tab=aulas`

**3. Secao OAB**
- Titulo "OAB" acima de dois cards lado a lado
- Card "1a Fase" e card "2a Fase", ambos com imagens de fundo e sombras
- 1a Fase navega para `/oab/trilhas-aprovacao`
- 2a Fase navega para `/videoaulas/oab` (ou rota existente de 2a fase)

**4. Grid de Categorias**
- Trilha de Conceitos e Iniciando em Concursos: lado a lado, mesmo tamanho (cards no grid 2x2)
- Portugues Juridico: card sozinho abaixo

**5. Areas do Direito (carrossel)**
- Titulo "Areas do Direito" seguido de um carrossel horizontal
- Cada area com card contendo imagem, nome e quantidade de materias
- Ordem cronologica conforme array AREAS_ORDEM existente
- Ao clicar, renderiza o conteudo da area inline abaixo (comportamento existente)

### Arquivos Modificados

- `src/components/mobile/MobileTrilhasAprender.tsx` - Reestruturacao completa do layout
- `src/pages/AulasDashboard.tsx` - Nova pagina de dashboard detalhado
- `src/App.tsx` - Adicionar rota `/aulas/dashboard`

### Dependencias

- Reutiliza dados de progresso ja buscados (`progressoConceitos`, `progressoAulas`)
- Reutiliza componentes existentes (`Progress`, `ScrollArea`, `UniversalImage`)
- Reutiliza thumbnails e imagens ja importadas
- Precisa de thumbnail para OAB 2a Fase (reutiliza oabThumb existente)

