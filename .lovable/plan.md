

# Pipeline de Extração e Geração de Conteúdo para Áreas do Direito

## Resumo

Conectar a mecânica existente de processamento de PDFs (que já funciona nas OAB Trilhas e no módulo Categorias) à nova trilha serpentina das Áreas do Direito. Ao clicar numa matéria na trilha, o admin poderá enviar um PDF, extrair tópicos e gerar conteúdo automaticamente -- tudo reutilizando a infraestrutura já existente.

## O que já existe e será reutilizado

- **Tabelas**: `categorias_materias`, `categorias_topicos`, `categorias_topico_paginas`, `categorias_progresso` -- já possuem toda a estrutura necessária (PDF URL, páginas, status de geração, slides, flashcards, questões)
- **Edge Functions**: `processar-pdf-oab-materia` (OCR do PDF), `identificar-temas-oab` (identifica temas do índice), `confirmar-temas-oab` (salva tópicos agrupados), `gerar-conteudo-categorias` (gera slides/flashcards/questões)
- **Componentes**: `OABPdfProcessorModal` (modal de upload e confirmação de temas)
- **Hook**: `useCategoriasAutoGeneration` (geração automática em lote com polling de progresso)

## Mudanças Necessárias

### 1. AreaTrilhaPage.tsx -- Adicionar botão de PDF e dados reais

- Importar `OABPdfProcessorModal` e adicionar botão "Adicionar Matéria (PDF)" visível apenas para o admin
- Buscar matérias da tabela `categorias_materias` filtradas por `categoria = area`
- Exibir contagem real de matérias e tópicos no header
- Calcular progresso real a partir de `categorias_progresso`
- Passar os dados reais para `MobileAreaTrilha`

### 2. MobileAreaTrilha.tsx -- Exibir matérias do banco

- Alterar a fonte de dados: em vez de buscar `BIBLIOTECA-ESTUDOS`, buscar `categorias_materias` filtradas pela área
- Para cada matéria, buscar seus `categorias_topicos` para calcular progresso
- Ao clicar num nó da trilha, navegar para `/categorias/materia/{id}` (página já existente que exibe os tópicos e permite gerar conteúdo)
- Exibir indicadores de status (pendente, gerando, concluído) nos nós

### 3. Fluxo do Admin (PDF -> Tópicos -> Conteúdo)

O fluxo completo ao clicar "Adicionar Matéria":

1. Modal abre pedindo link do Google Drive
2. `processar-pdf-oab-materia` faz OCR via Mistral
3. `identificar-temas-oab` analisa o índice e identifica temas
4. Admin confirma/desseleciona temas
5. `confirmar-temas-oab` salva na tabela `categorias_topicos`
6. Ao navegar para a matéria, `useCategoriasAutoGeneration` inicia geração automática via `gerar-conteudo-categorias`

### 4. Adaptação do handlePdfProcessed

- A função `handlePdfProcessed` no `AreaTrilhaPage` criará um registro em `categorias_materias` com `categoria = area` e inserirá os tópicos em `categorias_topicos`
- Reutilizar a mesma lógica já presente em `CategoriasMateriasPage.tsx`

## Detalhes Técnicos

### Arquivos modificados
- `src/pages/AreaTrilhaPage.tsx` -- adicionar modal PDF, buscar dados reais, lógica admin
- `src/components/mobile/MobileAreaTrilha.tsx` -- trocar fonte de dados de `BIBLIOTECA-ESTUDOS` para `categorias_materias`

### Chaves API reutilizadas
- `MISTRAL_API_KEY` (OCR do PDF)
- `GEMINI_KEY_1/2/3` (geração de conteúdo via `gerar-conteudo-categorias`)

### Navegação
- Nó da trilha -> `/categorias/materia/{id}` (página existente com lista de tópicos, geração automática, estudo)
- Tópico individual -> `/categorias/topico/{id}/estudo` (leitura de slides, flashcards, questões -- tudo existente)

### Verificação admin
- Reutilizar `useAuth` + verificação `user.email === "wn7corporation@gmail.com"`
- Botão de PDF visível apenas para admin
- Usuários comuns veem apenas as matérias já processadas

