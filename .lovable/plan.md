

# Conectar Nós da Trilha ao Pipeline de PDF (igual OAB Trilhas)

## Problema Atual
Ao clicar num nó da trilha serpentina (ex: "Noções gerais de direito penal"), o app navega para `/biblioteca/estudos/119` que resulta em 404. Falta uma página dedicada para cada matéria com o botão de upload de PDF e listagem de tópicos.

## Solucao

Criar uma nova pagina `AreaMateriaTrilhaPage` que replica a mecanica do `OABTrilhasMateria`, mas usando as tabelas `categorias_materias` e `categorias_topicos`.

### Fluxo

1. Usuario clica num no da trilha (ex: "Nocoes gerais de direito penal")
2. Navega para `/aulas/area/:area/materia/:livroId`
3. A nova pagina verifica se ja existe um registro em `categorias_materias` para esse livro
4. Se nao existe, admin ve o botao "Adicionar PDF" para criar o registro e extrair topicos
5. Se ja existe, mostra a lista de topicos com status de geracao e progresso
6. Ao clicar num topico, navega para `/categorias/topico/:id` (pagina ja existente)

### Arquivos a Criar

**`src/pages/AreaMateriaTrilhaPage.tsx`** -- Nova pagina que:
- Recebe `area` e `livroId` da URL
- Busca o livro em `BIBLIOTECA-ESTUDOS` para pegar nome e capa
- Busca/cria registro em `categorias_materias` vinculado a esse livro (usando campo `categoria = area`)
- Mostra botao "Adicionar PDF" para admin (usando `OABPdfProcessorModal`)
- Lista topicos de `categorias_topicos` com status de geracao
- Usa `useCategoriasAutoGeneration` para gerar conteudo automaticamente
- Layout similar ao `OABTrilhasMateria` (timeline com cards de topicos)

### Arquivos a Modificar

**`src/components/mobile/MobileAreaTrilha.tsx`**:
- Mudar navegacao de `/biblioteca/estudos/${livro.id}` para `/aulas/area/${area}/materia/${livro.id}`

**`src/App.tsx`**:
- Adicionar rota `/aulas/area/:area/materia/:livroId` apontando para `AreaMateriaTrilhaPage`

### Detalhes Tecnicos

- A `OABPdfProcessorModal` recebe um `materiaId` (de `oab_trilhas_materias`). Para as Areas, ao processar o PDF, primeiro criaremos um registro em `categorias_materias` com `categoria = nome_da_area` e `nome = titulo_do_livro`, e passaremos esse ID para o modal
- As Edge Functions `processar-pdf-oab-materia`, `identificar-temas-oab`, `confirmar-temas-oab` trabalham com `oab_trilhas_materias` e `oab_trilhas_topicos`. Para as Areas, precisamos adaptar o `handlePdfProcessed` para salvar em `categorias_materias` e `categorias_topicos` (mesmo padrao usado em `CategoriasMateriasPage`)
- A geracao automatica de conteudo usa `useCategoriasAutoGeneration` que chama `gerar-conteudo-categorias`
- Usuarios comuns veem apenas topicos ja gerados; admin ve tudo + botao de PDF
