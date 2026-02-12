
# Categorias do Direito - Nova aba na Jornada de Estudos

## Visao Geral

Criar uma segunda aba ("Categorias") na secao "Jornada de Estudos" (aba Aulas da home), que exibe areas do Direito baseadas nos titulos da Biblioteca de Estudos (ex: Direito Penal, Direito Civil, etc.). Cada categoria abre uma lista de materias/temas onde PDFs podem ser adicionados para geracao de conteudo, seguindo 100% o pipeline do OAB Trilhas. Tudo visivel apenas para o admin inicialmente.

---

## Estrutura do Plano

### 1. Database - Novas tabelas

Criar duas tabelas espelhando a estrutura do OAB Trilhas (`oab_trilhas_materias` e `oab_trilhas_topicos`):

**`categorias_materias`** (equivalente a `oab_trilhas_materias`)
- `id` SERIAL PRIMARY KEY
- `categoria` TEXT (ex: "Direito Penal", "Direito Civil" - vem de BIBLIOTECA-ESTUDOS."Area")
- `nome` TEXT (nome da materia/tema dentro da categoria)
- `descricao` TEXT
- `ordem` INTEGER
- `capa_url` TEXT
- `pdf_url` TEXT
- `ativo` BOOLEAN DEFAULT true
- `status_processamento` TEXT DEFAULT 'pendente'
- `total_paginas` INTEGER
- `temas_identificados` JSONB
- `created_at`, `updated_at` TIMESTAMPTZ

**`categorias_topicos`** (equivalente a `oab_trilhas_topicos`)
- `id` SERIAL PRIMARY KEY
- `materia_id` INTEGER REFERENCES categorias_materias(id)
- `ordem` INTEGER
- `titulo` TEXT
- `descricao` TEXT
- `conteudo_gerado` TEXT
- `exemplos` JSONB, `termos` JSONB, `flashcards` JSONB, `questoes` JSONB
- `capa_url` TEXT, `url_narracao` TEXT
- `status` TEXT DEFAULT 'pendente'
- `pagina_inicial` INTEGER, `pagina_final` INTEGER
- `subtopicos` JSONB
- `progresso` INTEGER DEFAULT 0
- `posicao_fila` INTEGER, `tentativas` INTEGER DEFAULT 0
- `capa_versao` INTEGER DEFAULT 0
- `created_at`, `updated_at` TIMESTAMPTZ

**`categorias_progresso`** (progresso do usuario)
- `id` UUID DEFAULT gen_random_uuid()
- `user_id` UUID REFERENCES auth.users(id)
- `materia_id` INTEGER REFERENCES categorias_materias(id)
- `topico_id` INTEGER REFERENCES categorias_topicos(id)
- `leitura_concluida` BOOLEAN DEFAULT false
- `flashcards_concluidos` BOOLEAN DEFAULT false
- `questoes_concluidas` BOOLEAN DEFAULT false
- `created_at`, `updated_at` TIMESTAMPTZ

RLS: Leitura publica para materias e topicos, progresso restrito ao usuario.

### 2. Menu de Alternancia na Home (Aba Aulas)

**Arquivo: `src/components/mobile/MobileTrilhasAprender.tsx`** (EDITAR)

Adicionar um menu toggle abaixo do subtitulo "Fundamentos do Direito", com duas opcoes:
- **Conceitos** (atual - mostra a trilha de materias existente)
- **Categorias** (nova - mostra categorias do Direito)

O menu segue o mesmo estilo dos toggles existentes no app (botoes pill lado a lado). A aba "Categorias" so aparece para o admin (`user?.email === ADMIN_EMAIL`).

### 3. Tela de Categorias na Home

**Arquivo: `src/components/mobile/MobileCategoriasDireito.tsx`** (CRIAR)

Componente que exibe um grid/lista de cards com as categorias do Direito (Direito Penal, Direito Civil, etc.), obtidas da tabela BIBLIOTECA-ESTUDOS (campo "Area"). Cada card mostra:
- Nome da categoria
- Quantidade de materias cadastradas
- Progresso geral (se houver)

Ao clicar, navega para `/categorias/:categoria`.

### 4. Pagina de Materias da Categoria

**Arquivo: `src/pages/CategoriasMateriasPage.tsx`** (CRIAR)

Timeline identica ao `OABTrilhasMateria.tsx`:
- Lista de materias/temas cadastrados na categoria
- Botao de upload de PDF (admin only)
- Auto-geracao de conteudo ao processar PDF
- Capas, progresso, status de geracao

### 5. Paginas de Estudo (Topicos, Flashcards, Questoes)

**Reutilizar componentes existentes** - As paginas de estudo, flashcards e questoes seguem o mesmo padrao do OAB Trilhas. Criar paginas wrapper:

- `src/pages/CategoriasTopicoEstudo.tsx` - Estudo/leitura de slides
- `src/pages/CategoriasTopicoFlashcards.tsx` - Flashcards
- `src/pages/CategoriasTopicoQuestoes.tsx` - Questoes

Esses componentes serao muito similares aos do OAB Trilhas, alterando apenas as tabelas consultadas de `oab_trilhas_*` para `categorias_*`.

### 6. Edge Function de Geracao de Conteudo

**Arquivo: `supabase/functions/gerar-conteudo-categorias/index.ts`** (CRIAR)

100% baseada na `gerar-conteudo-oab-trilhas`, com as seguintes diferencas:
- Tabelas: `categorias_topicos` e `categorias_materias`
- Prompt: Em vez de mencionar OAB, foca em "estudo aprofundado da area"
- Mantem o estilo "Cafe com Professor", estrutura de slides, flashcards e questoes

### 7. Menu de Rodape da Jornada de Estudos

**Arquivo: `src/components/categorias/CategoriasBottomNav.tsx`** (CRIAR)

Menu de rodape semelhante ao `BibliotecaBottomNav.tsx`, com tons de vermelho/escarlate (diferenciando da biblioteca em amber):
- **Aulas** - Lista de categorias/materias (pagina principal)
- **Progresso** - Visao geral do progresso por area
- **Historico** - Ultima aula acessada
- **Estatisticas** - Areas de maior interesse, tempo de estudo
- **Material** - Material de apoio e recursos

### 8. Rotas

**Arquivo: `src/App.tsx`** (EDITAR)

Adicionar rotas:
- `/categorias` - Lista de categorias
- `/categorias/:categoria` - Materias de uma categoria
- `/categorias/materia/:materiaId` - Topicos de uma materia
- `/categorias/topico/:topicoId/estudo` - Estudo de slides
- `/categorias/topico/:topicoId/flashcards` - Flashcards
- `/categorias/topico/:topicoId/questoes` - Questoes
- `/categorias/progresso` - Tela de progresso
- `/categorias/historico` - Historico de estudo
- `/categorias/estatisticas` - Estatisticas

### 9. Restricao de Acesso (Admin Only)

Em todos os componentes novos, verificar `user?.email === "wn7corporation@gmail.com"`. Se nao for admin:
- A aba "Categorias" nao aparece no toggle da home
- As rotas redirecionam para home

---

## Resumo de Arquivos

| Acao | Arquivo |
|------|---------|
| CRIAR | `supabase/migrations/categorias_tables.sql` |
| EDITAR | `src/components/mobile/MobileTrilhasAprender.tsx` |
| EDITAR | `src/components/desktop/DesktopTrilhasAprender.tsx` |
| CRIAR | `src/components/mobile/MobileCategoriasDireito.tsx` |
| CRIAR | `src/pages/CategoriasMateriasPage.tsx` |
| CRIAR | `src/pages/CategoriasTopicoEstudo.tsx` |
| CRIAR | `src/pages/CategoriasTopicoFlashcards.tsx` |
| CRIAR | `src/pages/CategoriasTopicoQuestoes.tsx` |
| CRIAR | `src/pages/CategoriasProgresso.tsx` |
| CRIAR | `src/pages/CategoriasHistorico.tsx` |
| CRIAR | `src/pages/CategoriasEstatisticas.tsx` |
| CRIAR | `src/components/categorias/CategoriasBottomNav.tsx` |
| CRIAR | `src/hooks/useCategoriasAutoGeneration.ts` |
| CRIAR | `supabase/functions/gerar-conteudo-categorias/index.ts` |
| EDITAR | `src/App.tsx` (adicionar rotas) |

## Observacoes

- A geracao de conteudo usa o mesmo prompt "Cafe com Professor" do OAB Trilhas, adaptado para estudo generico
- As categorias sao derivadas dos titulos unicos da coluna "Area" da tabela BIBLIOTECA-ESTUDOS (27 areas disponiveis)
- O pipeline de PDF (upload, extracao, identificacao de temas, geracao) reutiliza a mesma logica do OAB Trilhas
- Tudo fica restrito ao admin ate aprovacao para liberacao geral
