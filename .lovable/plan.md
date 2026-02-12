

# Painel de Rankings e Engajamento Detalhado

## O que sera criado

Uma nova aba **"Rankings"** dentro da pagina AdminControle, com secoes dedicadas para visualizar em detalhes o engajamento dos usuarios. Tudo baseado nos dados ja capturados na tabela `page_views` (10.400+ registros, 2.750+ sessoes, 377 usuarios identificados).

---

## Secoes do Ranking

### 1. Ranking de Tempo de Tela (Usuarios que ficam mais tempo)
- Calcula o tempo estimado de sessao de cada usuario baseado no intervalo entre page views consecutivas de uma mesma sessao
- Exibe: Nome, email, tempo total estimado, numero de sessoes, ultima atividade
- Ordenado por tempo total (maior primeiro)

### 2. Areas do Direito Mais Acessadas
- Agrupa page_views por categorias de area juridica (baseado no page_path)
- Mapeia rotas como `/vade-mecum`, `/constituicao`, `/codigos`, `/flashcards`, `/oab-trilhas`, etc. para areas tematicas
- Exibe barra de progresso com quantidade e percentual

### 3. Funcoes Mais Utilizadas
- Agrupa por funcionalidade: Flashcards, Questoes, Videoaulas, Mapas Mentais, Resumos, Evelyn, Vade Mecum, etc.
- Baseado no mapeamento de page_path para funcionalidade
- Ranking com barras visuais

### 4. Ranking de Fidelidade (quem volta todo dia)
- Calcula quantos dias distintos cada usuario acessou o app no periodo
- Exibe: Nome, email, dias ativos, streak (dias consecutivos), ultima visita
- Ordenado por dias ativos (maior primeiro)

### 5. Paginas Mais Populares (detalhado)
- Ja existe parcialmente, sera enriquecido com informacoes de usuarios unicos por pagina

---

## Implementacao Tecnica

### Arquivo 1: `src/hooks/useAdminRankings.ts` (NOVO)
Hooks de dados com React Query:

- **`useRankingTempoTela(dias)`** -- Consulta page_views agrupando por user_id/session_id, calcula intervalo entre page views consecutivas (max 30min gap = mesma sessao), soma tempo total por usuario. Faz JOIN com profiles para nome/email.

- **`useRankingAreasAcessadas(dias)`** -- Consulta page_views, mapeia page_path para areas do direito usando um dicionario local, agrega contagens.

- **`useRankingFuncoesUtilizadas(dias)`** -- Similar ao anterior mas mapeando para funcionalidades (Flashcards, Questoes, Evelyn, etc).

- **`useRankingFidelidade(dias)`** -- Conta dias distintos de acesso por user_id, calcula streak de dias consecutivos, ordena por mais fiel.

- **`useRankingPesquisas(dias)`** -- Usa dados de `cache_pesquisas` para termos mais buscados por area.

Todas as queries serao feitas client-side com consultas diretas ao Supabase (mesmo padrao dos hooks existentes), sem necessidade de criar novas RPC functions.

### Arquivo 2: `src/pages/Admin/AdminControle.tsx` (EDITAR)
- Adicionar nova aba "Rankings" ao TabsList (5 tabs no total)
- Nova TabsContent com as 5 secoes do ranking, cada uma em um Card
- Cada ranking tera: titulo, badge com total, lista ordenada com posicao (#1, #2...), barras de progresso, e badges informativos
- Layout responsivo: cards empilhados no mobile, grid no desktop

### Detalhes visuais
- Medalhas para top 3 (ouro, prata, bronze)
- Barras de progresso relativas ao primeiro colocado
- Cards com gradientes sutis
- Scroll area para listas longas (max 20 itens por ranking)
- Filtro de periodo compartilhado com o resto do dashboard (Hoje, 7d, 30d, 90d)

### Logica de calculo de tempo de tela
```text
Para cada sessao (session_id):
  1. Ordenar page_views por created_at
  2. Para cada par consecutivo, calcular diferenca
  3. Se diferenca < 30 minutos, somar ao tempo da sessao
  4. Se diferenca >= 30 minutos, iniciar nova "sub-sessao"
  5. Adicionar 1 minuto para a ultima page view (tempo estimado de leitura)
  
Agrupar por user_id e somar todas as sessoes
```

### Mapeamento de rotas para areas
```text
Penal: /codigos (penal), /flashcards (penal)
Civil: /codigos (civil), /flashcards (civil)
Constitucional: /constituicao, /flashcards (constitucional)
OAB: /oab-trilhas, /ferramentas/questoes
Trabalhista: /codigos (trabalho)
Administrativo: /codigos (administrativo)
Geral: /vade-mecum, /bibliotecas, /resumos-juridicos
```

### Mapeamento de rotas para funcoes
```text
Flashcards: /flashcards
Questoes: /ferramentas/questoes
Videoaulas: /videoaulas
Vade Mecum: /vade-mecum
Constituicao: /constituicao
Codigos e Leis: /codigos
Evelyn IA: /evelyn, /ferramentas/evelyn
Bibliotecas: /bibliotecas
Resumos: /resumos-juridicos
Mapas Mentais: /mapas-mentais
OAB Trilhas: /oab-trilhas
Sumulas: /sumulas
Audio Aulas: /audio-aulas
```

## Sequencia de implementacao
1. Criar `useAdminRankings.ts` com todos os hooks
2. Editar `AdminControle.tsx` para adicionar aba Rankings com as 5 secoes
