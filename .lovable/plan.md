

## Corrigir Dashboard Controle - Metricas e Filtros

### Problemas Identificados

1. **"Novos Hoje" mostra 7, mas sao 33**: O codigo usa UTC (meia-noite em Londres). No fuso do Brasil (UTC-3), o dia comeca 3h depois. Resultado: perde os cadastros entre 21h-23h59 do dia anterior no horario de Brasilia.

2. **"Online Agora" mostra 0, mas tem 13 sessoes ativas**: A query do cliente pode ter race condition com autenticacao. Alem disso, nao ha fallback robusto.

3. **Paginas Mais Acessadas mostra dados incompletos**: O hook busca TODAS as page_views (6.653 registros) e conta no frontend, mas o Supabase silenciosamente retorna no maximo 1.000 linhas. Os dados estao truncados.

4. **Sem opcao de filtro por periodo**: So mostra 7 dias, sem opcao de "Hoje", "30 dias", etc.

### Solucao

#### 1. Criar funcoes RPC no banco de dados para agregar dados corretamente

Criar 3 funcoes SQL que fazem a contagem diretamente no banco, eliminando o limite de 1000 linhas:

- `get_novos_usuarios_count(start_date, end_date)` - retorna contagem de novos usuarios no periodo
- `get_paginas_populares(start_date, end_date, limite)` - retorna paginas agrupadas e contadas no banco
- `get_online_agora()` - retorna contagem de sessoes unicas nos ultimos 5 minutos

Todas usarao `SECURITY DEFINER` com verificacao de admin para seguranca.

#### 2. Corrigir timezone para "Novos Hoje"

Usar o fuso `America/Sao_Paulo` ao calcular o inicio do dia, garantindo que "hoje" corresponda ao dia real no Brasil.

#### 3. Adicionar filtro de periodo no dashboard

Adicionar seletor no topo com opcoes:
- Hoje
- 7 dias
- 30 dias
- 90 dias

Este filtro afetara: "Novos no periodo", "Paginas Mais Acessadas", "Usuarios Ativos" e "Novos Cadastros" (lista).

#### 4. Adicionar metricas extras

- **Novos Hoje / 7d / 30d**: Cards com contagens por periodo
- **Cadastros por Dia**: Mini grafico com os ultimos 7/30 dias
- **Retencao**: Usuarios que voltaram nos ultimos 7 dias vs total
- **Paginas por periodo**: Filtro "Hoje", "7 dias", "30 dias"

### Arquivos Modificados

**Banco de dados (migracao SQL):**
- Criar funcao `get_admin_paginas_populares(p_dias INTEGER)` que faz `GROUP BY page_path` e `COUNT(*)` diretamente no banco
- Criar funcao `get_admin_online_count()` que retorna sessoes unicas nos ultimos 5 min
- Criar funcao `get_admin_novos_por_periodo(p_dias INTEGER)` que conta novos usuarios no fuso de Brasilia

**`src/hooks/useAdminControleStats.ts`:**
- Corrigir `useEstatisticasGerais`: usar fuso `America/Sao_Paulo` para "Novos Hoje", e adicionar contagens para 7d e 30d
- Corrigir `usePaginasPopulares`: aceitar parametro de dias, usar RPC em vez de buscar todas as linhas
- Corrigir `useOnlineAgoraRealtime`: usar RPC `get_admin_online_count` para contagem precisa
- Adicionar hook `useCadastrosPorDia` para grafico de evolucao

**`src/pages/Admin/AdminControle.tsx`:**
- Adicionar estado `periodoFiltro` com opcoes "hoje", "7dias", "30dias", "90dias"
- Adicionar seletor de periodo (botoes ou select) abaixo do header
- Atualizar cards: mostrar "Novos (periodo selecionado)" dinamicamente
- Atualizar tab Paginas: usar o periodo selecionado
- Adicionar card com mini grafico de cadastros por dia (usando Recharts, ja instalado)
- Mostrar mais detalhes nas metricas: total de page views no periodo, media de cadastros/dia

### Resultado Esperado

- "Novos Hoje" mostrara 33 (correto com fuso Brasil)
- "Online Agora" mostrara 13 (sessoes reais ativas)
- "Paginas Mais Acessadas" mostrara dados completos (sem truncamento)
- Filtro de periodo permitira ver metricas de Hoje, 7d, 30d, 90d
- Metricas mais detalhadas e precisas em todo o dashboard

