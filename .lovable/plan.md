

# Melhorias na Biblioteca: Plano de Leitura, Historico e Favoritos

## Problemas identificados

1. **Plano de Leitura - Dialog nao rola**: O `ScrollArea` no step 2 (lista de livros) nao tem altura fixa definida, impedindo scroll
2. **Botao Voltar mal posicionado**: Dentro do dialog, o botao "Voltar" esta pequeno e misturado com o conteudo
3. **Amarelo sem contraste**: O amber-500 (#f59e0b) nao contrasta bem com texto branco
4. **Favoritos sem capa**: Registros antigos tem `capa_url: null` no banco. Precisa buscar a capa dinamicamente da tabela original como fallback
5. **Historico vazio e simples**: Nao mostra detalhes como tempo, categoria, capa grande
6. **Todas as paginas precisam de mais detalhes e funcionalidades**

---

## Mudancas planejadas

### 1. Plano de Leitura (`BibliotecaPlanoLeitura.tsx`)

**Correcao do scroll:**
- Adicionar `h-[60vh]` ao `ScrollArea` do step 2 (selecao de livros) para garantir que a lista role

**Botao Voltar destacado:**
- Mover para uma barra fixa no topo do dialog, com icone de seta e nome da biblioteca selecionada, fundo contrastante

**Contraste do amarelo:**
- Trocar `bg-amber-500` por `bg-amber-600` nos botoes de acao e tabs ativos para melhor contraste com texto branco

**Mais funcionalidades:**
- Mostrar contagem total de livros no plano e estatisticas (ex: "3 livros concluidos de 10")
- Barra de progresso geral do plano
- Na lista de livros, mostrar data de adicao
- No card do livro em "Lendo", exibir quando comecou a ler
- Melhorar dialog de edicao: adicionar opcao de avaliar (1-5 estrelas) e data de conclusao

### 2. Favoritos (`BibliotecaFavoritos.tsx`)

**Correcao da capa:**
- Para favoritos com `capa_url` nulo, fazer uma query paralela na tabela original do livro para buscar a capa dinamicamente
- Criar um hook `useFavoritosComCapas` que enriquece os favoritos com capas faltantes

**Mais detalhes:**
- Mostrar data em que foi favoritado
- Cards maiores com capa mais visivel (w-14 h-20 em vez de w-12 h-16)
- Mostrar autor quando disponivel
- Botao para ir direto ao livro mais evidente
- Contador por categoria no header do grupo

### 3. Historico (`BibliotecaHistorico.tsx`)

**Mais detalhes:**
- Mostrar tempo estimado de leitura por sessao (calcular diferenca entre acessos consecutivos do mesmo livro)
- Cards clicaveis que levam ao livro
- Capas maiores e mais destacadas
- Badge com a categoria/biblioteca
- Mostrar quantas vezes o livro foi acessado (agrupando acessos repetidos do mesmo livro)
- Estatisticas no header: "X livros lidos esta semana", "Y minutos de leitura"

---

## Detalhes tecnicos

### Arquivo 1: `src/pages/BibliotecaPlanoLeitura.tsx` (EDITAR)
- Linha 365: `DialogContent` - adicionar `overflow-hidden` e ajustar flex layout
- Linha 424: `ScrollArea` - adicionar `h-[60vh]` para forcar altura e permitir scroll
- Tabs: trocar `bg-amber-500` por `bg-amber-600` em todos os botoes ativos
- Botao Voltar: mover para header do dialog com estilo destacado (bg-amber-600/10, borda, tamanho maior)
- Adicionar estatisticas gerais no header (total de livros, barra de progresso geral)

### Arquivo 2: `src/pages/BibliotecaFavoritos.tsx` (EDITAR)
- Criar logica para buscar capas faltantes: para cada favorito sem `capa_url`, fazer query na tabela `biblioteca_tabela` correspondente usando `item_id`
- Usar `useQuery` com `select` para buscar apenas a coluna de capa
- Mapear campos de capa por biblioteca (mesmo mapeamento de `BIBLIOTECAS` do PlanoLeitura)
- Melhorar UI dos cards com mais informacoes

### Arquivo 3: `src/pages/BibliotecaHistorico.tsx` (EDITAR)
- Adicionar navegacao ao clicar no item (usando mesmo `BIBLIOTECA_ROUTE_MAP` dos favoritos)
- Calcular e exibir tempo estimado de permanencia entre acessos consecutivos
- Agrupar acessos repetidos do mesmo livro mostrando contagem
- Adicionar estatisticas no header
- Melhorar visual dos cards com capas maiores

### Arquivo 4: `src/components/biblioteca/BibliotecaFavoritoButton.tsx` (EDITAR)
- Nenhuma mudanca estrutural, mas garantir que todas as paginas de livro passem `capaUrl` corretamente (ja esta feito para Estudos, verificar demais)

