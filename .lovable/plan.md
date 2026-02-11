
# Melhorias no Painel Admin Controle

## Problemas Identificados

1. **"Online Agora"** usa RPC `get_admin_online_count` que conta sessoes unicas dos ultimos 5 minutos em `page_views` -- isso e razoavel, mas nao mostra detalhes ao clicar
2. **Cards de estatisticas nao sao clicaveis** -- nao abrem listas detalhadas
3. **Periodo "Hoje/7d/30d/90d"** nao afeta corretamente todos os cards (Novos Hoje, Novos 7d, Novos 30d sao sempre fixos, nao mudam com o filtro)
4. **Assinantes Premium** faltam detalhes como telefone, nome, metodo de pagamento
5. **Faltam metricas** como taxa de retencao, receita total, etc.

## Solucao

### 1. Cards clicaveis com Dialog de detalhes

Cada card (Online Agora, Novos Hoje, Ativos, Total Usuarios) ao ser clicado abre um Dialog/Sheet mostrando a lista detalhada com: nome, email, telefone, dispositivo, data de cadastro.

### 2. Online Agora -- detalhes reais

- Criar uma RPC `get_admin_online_details` que retorna os usuarios com `page_views` nos ultimos 5 minutos, com join em `profiles` para trazer nome, email, telefone, dispositivo
- Ao clicar no card "Online Agora", abrir dialog mostrando essas pessoas em tempo real

### 3. Corrigir filtro de periodo

Os cards "Novos Hoje", "Novos 7d", "Novos 30d" sao atualmente fixos. Vou reestruturar para que o periodo selecionado afete os dados mostrados:
- Quando "Hoje" selecionado: mostrar "Novos Hoje" em destaque
- Quando "7 dias": mostrar novos nos ultimos 7 dias
- Quando "30 dias": mostrar novos nos ultimos 30 dias  
- Quando "90 dias": mostrar novos nos ultimos 90 dias

Cada card tera o numero correto do periodo selecionado.

### 4. Assinantes Premium -- mais detalhes

- Adicionar join com `profiles` para trazer nome, telefone
- Mostrar metodo de pagamento (campo `payment_method` ja existe na tabela `subscriptions`)
- Layout responsivo em cards para mobile ao inves de tabela

### 5. Novas metricas

- **Receita total** (soma de `amount` das subscriptions autorizadas)
- **Receita por plano** (mensal vs anual vs vitalicio)
- **Novos Premium no periodo** (assinantes que se tornaram premium dentro do filtro de periodo)

## Detalhes Tecnicos

### Arquivo: Migracao SQL (nova RPC)

```sql
CREATE OR REPLACE FUNCTION public.get_admin_online_details()
RETURNS TABLE(
  user_id uuid,
  nome text,
  email text,
  telefone text,
  dispositivo text,
  page_path text,
  last_seen timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT DISTINCT ON (pv.user_id)
    pv.user_id,
    p.nome,
    p.email,
    p.telefone,
    p.dispositivo,
    pv.page_path,
    pv.created_at as last_seen
  FROM page_views pv
  LEFT JOIN profiles p ON p.id = pv.user_id
  WHERE pv.created_at >= NOW() - INTERVAL '5 minutes'
    AND pv.user_id IS NOT NULL
  ORDER BY pv.user_id, pv.created_at DESC;
$$;
```

Tambem criar RPC para detalhes de usuarios ativos no periodo:

```sql
CREATE OR REPLACE FUNCTION public.get_admin_ativos_detalhes(p_dias integer DEFAULT 7)
RETURNS TABLE(
  user_id uuid,
  nome text,
  email text,
  telefone text,
  dispositivo text,
  total_views bigint,
  last_seen timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    pv.user_id,
    p.nome,
    p.email,
    p.telefone,
    p.dispositivo,
    COUNT(*)::BIGINT as total_views,
    MAX(pv.created_at) as last_seen
  FROM page_views pv
  LEFT JOIN profiles p ON p.id = pv.user_id
  WHERE pv.created_at >= NOW() - (p_dias || ' days')::INTERVAL
    AND pv.user_id IS NOT NULL
  GROUP BY pv.user_id, p.nome, p.email, p.telefone, p.dispositivo
  ORDER BY last_seen DESC;
$$;
```

### Arquivo: `src/hooks/useAdminControleStats.ts`

- Adicionar hooks: `useOnlineDetails`, `useAtivosDetalhes`
- Atualizar `useListaAssinantesPremium` para incluir nome, telefone, payment_method do join com profiles
- Adicionar hook `useReceitaPremium` para calcular receita total e por plano

### Arquivo: `src/pages/Admin/AdminControle.tsx`

- Tornar cada card de estatistica clicavel (onClick abre um Dialog)
- Adicionar componente `DetalhesDialog` que recebe tipo (online/novos/ativos/total) e mostra lista detalhada
- Reestruturar cards para respeitar o periodo selecionado
- Melhorar tabela de assinantes premium com mais colunas e layout responsivo (cards no mobile)
- Adicionar secao de receita com cards mostrando receita total, por plano, e novos premium no periodo

### Resultado Esperado

- Cards clicaveis que abrem dialogs com detalhes completos (nome, email, telefone, dispositivo)
- "Online Agora" mostra exatamente quem esta no app neste momento
- Filtro de periodo funciona corretamente em todos os cards
- Assinantes premium com informacoes completas (nome, email, telefone, plano, valor, data, metodo de pagamento)
- Novas metricas de receita e conversao
- Layout 100% responsivo
