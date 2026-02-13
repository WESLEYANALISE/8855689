
# Melhorias no Painel Administrativo "Controle"

## Resumo das Mudancas

O painel sera reestruturado com 4 grandes melhorias: (1) Online Agora + Online 30min, (2) Assinantes Premium em tempo real, (3) remocao do botao "Atualizar" e mais metricas clicaveis, (4) secao de Feedback diario com IA Gemini.

---

## 1. Online Agora + Online 30 Minutos

Atualmente so mostra "Online Agora" (ultimos 5 minutos). Sera adicionado um segundo card "Online 30min" que mostra usuarios unicos dos ultimos 30 minutos.

- Criar nova funcao RPC no Supabase: `get_admin_online_30min_count` (conta usuarios distintos com `page_views` nos ultimos 30 minutos)
- Criar nova funcao RPC: `get_admin_online_30min_details` (lista detalhada dos usuarios dos ultimos 30 minutos)
- No hook `useAdminControleStats.ts`, adicionar `useOnline30MinRealtime` e `useOnline30MinDetails`
- Na UI, o card "Online Agora" e "Online 30min" ficarao lado a lado no grid de metricas
- Ao clicar, abre o dialog mostrando a lista de pessoas com nome, email, pagina atual e quando foram vistos por ultimo

## 2. Assinantes Premium em Tempo Real

A lista de assinantes nao atualiza em tempo real. Sera corrigido:

- Adicionar canal Supabase Realtime escutando a tabela `subscriptions` (eventos INSERT e UPDATE)
- Quando detectar mudanca, refaz a query de `useListaAssinantesPremium` automaticamente
- Reduzir o `refetchInterval` de 60s para 15s como fallback
- Garantir que a lista mostra TODOS os assinantes (sem limite), ordenados por data mais recente

## 3. Remover Botao "Atualizar" + Mais Metricas Clicaveis

- Remover o botao "Atualizar" do header (os dados ja atualizam automaticamente via realtime + polling)
- Transformar os cards de Premium (Total Premium, Taxa Conversao, Novos Premium, Receita) em clicaveis
  - Ao clicar em "Total Premium" ou "Novos Premium", scrolla para a secao de assinantes
  - Ao clicar em "Receita Total", abre dialog com detalhamento por tipo de plano
- Cards de Page Views e Media de cadastros tambem clicaveis, abrindo dialog com detalhes
- Cada card tera visual de hover melhorado para indicar interatividade

## 4. Secao de Feedback Diario com IA (Gemini)

Nova secao "Feedback do Dia" que usa a API Gemini (mesmas chaves GEMINI_KEY_1/2/3 do chat) para gerar um resumo diario.

### Como funciona:
- Novo edge function `admin-daily-feedback` que:
  1. Busca dados do dia atual: page views, novos usuarios, paginas populares, assinantes novos
  2. Monta um prompt para Gemini pedindo analise e feedback
  3. Retorna o texto formatado em markdown
- Cache no Supabase: nova tabela `admin_daily_feedback` com colunas `id`, `data` (date, unique), `feedback_text`, `created_at`
  - Se ja tem feedback do dia, retorna do cache
  - Se nao tem, gera com Gemini e salva
- Na UI:
  - Card com icone de IA/cerebro
  - Mostra o feedback do dia formatado em markdown (react-markdown)
  - Botao "Regenerar" para forcar nova geracao
  - Indicador de loading enquanto gera

### Prompt da Gemini incluira:
- Total de usuarios online hoje
- Novos cadastros do dia
- Paginas mais acessadas do dia
- Novos assinantes premium do dia
- Comparacao com dia anterior (se disponivel)
- A IA retornara porcentagens, insights e recomendacoes

---

## Detalhes Tecnicos

### Arquivos a criar:
- `supabase/functions/admin-daily-feedback/index.ts` - Edge function que busca dados e chama Gemini
- Migracoes SQL para:
  - `get_admin_online_30min_count()` - RPC
  - `get_admin_online_30min_details()` - RPC
  - `admin_daily_feedback` - tabela de cache

### Arquivos a modificar:
- `src/hooks/useAdminControleStats.ts` - Adicionar hooks para online 30min, realtime de subscriptions, e feedback diario
- `src/pages/Admin/AdminControle.tsx` - Reestruturar UI com todas as mudancas acima

### Estrutura dos novos cards (grid superior):
```text
+----------------+------------------+
| Online Agora   | Online 30min     |
| (5 min)        | (30 min)         |
+----------------+------------------+
| Novos (periodo)| Ativos (periodo) |
+----------------+------------------+
| Total Usuarios | Page Views       |
+----------------+------------------+
```

### Fluxo do Feedback IA:
```text
Usuario abre Controle
  -> Frontend chama edge function admin-daily-feedback
  -> Edge function verifica cache (tabela admin_daily_feedback)
  -> Se tem do dia: retorna texto
  -> Se nao: busca metricas via Supabase, monta prompt, chama Gemini, salva cache, retorna
  -> Frontend renderiza com react-markdown
```
