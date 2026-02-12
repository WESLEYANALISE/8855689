

# Menu de Rodape Exclusivo para Biblioteca Juridica

## Visao Geral

Criar um menu de rodape (bottom nav) exclusivo para a Biblioteca Juridica, seguindo o mesmo padrao visual do `LeisBottomNav`, com 5 funcoes e botao central elevado de "Procurar". Sera necessario criar novas tabelas no Supabase para plano de leitura e favoritos.

## As 5 Funcoes do Menu

1. **Acervo** (icone: BookOpen) -- Tela principal da biblioteca (ja existe)
2. **Plano de Leitura** (icone: Target) -- Gerenciar livros que esta lendo/quer ler com comentarios
3. **Procurar** (icone: Search, botao central elevado) -- Busca exclusiva nos livros de todas as bibliotecas
4. **Historico** (icone: Clock) -- Livros acessados recentemente (usa tabela `bibliotecas_acessos` ja existente)
5. **Favoritos** (icone: Heart) -- Livros marcados como favoritos

## Novas Tabelas no Supabase

### `biblioteca_plano_leitura`
- `id` UUID (PK, default gen_random_uuid())
- `user_id` UUID (not null)
- `biblioteca_tabela` TEXT (qual biblioteca: BIBLIOTECA-ESTUDOS, etc.)
- `item_id` INTEGER (id do livro)
- `titulo` TEXT
- `capa_url` TEXT
- `status` TEXT (quero_ler, lendo, concluido)
- `comentario` TEXT (anotacao pessoal)
- `progresso` INTEGER (0-100, default 0)
- `created_at` TIMESTAMPTZ (default now())
- `updated_at` TIMESTAMPTZ (default now())

### `biblioteca_favoritos`
- `id` UUID (PK, default gen_random_uuid())
- `user_id` UUID (not null)
- `biblioteca_tabela` TEXT
- `item_id` INTEGER
- `titulo` TEXT
- `capa_url` TEXT
- `created_at` TIMESTAMPTZ (default now())

Ambas com RLS habilitado: usuarios so acessam seus proprios dados.

## Novos Arquivos

### 1. `src/components/biblioteca/BibliotecaBottomNav.tsx`
Componente do menu de rodape, identico ao LeisBottomNav em estrutura, mas com cores amber/dourado (seguindo a paleta da biblioteca) e as 5 abas: Acervo, Plano, Procurar (central), Historico, Favoritos.

### 2. `src/pages/BibliotecaBusca.tsx`
Pagina de busca exclusiva nos livros. Busca em todas as tabelas de biblioteca (BIBLIOTECA-ESTUDOS, BIBLIOTECA-CLASSICOS, BIBLIOTECA-FORA-DA-TOGA, etc.) por titulo e area. Interface com campo de busca, sugestoes rapidas e resultados agrupados por biblioteca.

### 3. `src/pages/BibliotecaPlanoLeitura.tsx`
Pagina para gerenciar plano de leitura com 3 abas: "Quero Ler", "Lendo" e "Concluido". O usuario pode adicionar comentarios, atualizar progresso e mover livros entre status.

### 4. `src/pages/BibliotecaHistorico.tsx`
Pagina de historico mostrando livros acessados recentemente, agrupados por data (hoje, ontem, esta semana, etc.), usando dados da tabela `bibliotecas_acessos` ja existente.

### 5. `src/pages/BibliotecaFavoritos.tsx`
Pagina listando livros favoritados, com opcao de remover favoritos.

## Arquivos Modificados

### `src/pages/BibliotecaIniciante.tsx`
Adicionar o `BibliotecaBottomNav` no final do componente, com `activeTab="acervo"`.

### `src/App.tsx`
Adicionar rotas:
- `/biblioteca/busca` -- BibliotecaBusca
- `/biblioteca/plano-leitura` -- BibliotecaPlanoLeitura
- `/biblioteca/historico` -- BibliotecaHistorico
- `/biblioteca/favoritos` -- BibliotecaFavoritos

### `src/hooks/useHierarchicalNavigation.ts`
Adicionar navegacao de volta para as novas rotas, apontando para `/bibliotecas`.

## Detalhes Tecnicos

### BibliotecaBottomNav
- Cores: `amber-500` para itens ativos (seguindo paleta dourada da biblioteca)
- Botao central: gradiente `from-amber-500 to-amber-700` com sombra dourada
- Estrutura identica ao LeisBottomNav (grid 5 colunas, botao central elevado com -mt-6)

### BibliotecaBusca
- Busca paralela em todas as tabelas de biblioteca usando `Promise.allSettled`
- Cada tabela e buscada com `.ilike('Tema', '%query%')` ou campo equivalente
- Resultados agrupados por biblioteca com contagem

### Plano de Leitura
- Requer autenticacao (usuario logado)
- ToggleGroup com 3 opcoes: Quero Ler / Lendo / Concluido
- Card de cada livro mostra capa, titulo, comentario e barra de progresso (para "Lendo")
- Dialog para adicionar comentario e atualizar progresso

### Historico
- Consulta `bibliotecas_acessos` filtrando por `user_id` ou `session_id`
- Agrupa por data usando `date-fns`
- Mostra titulo do livro, biblioteca de origem e data/hora

### Favoritos
- Botao de coracao nos cards de livros (a ser adicionado nas paginas individuais de biblioteca futuramente)
- Lista simples com capa, titulo e opcao de remover

