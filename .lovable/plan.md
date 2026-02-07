
# Plano: Corrigir Resenha Diária - Leis Novas Não Aparecem

## Resumo do Problema
As leis estão sendo raspadas corretamente do Planalto (868 leis pendentes desde janeiro), mas não aparecem na Resenha Diária porque a automação de formatação está falhando silenciosamente.

---

## Causa Raiz
A função `raspar-resenha-diaria` tenta chamar `automacao-formatacao-leis` após raspar, mas usa uma variável de ambiente incorreta (`SUPABASE_ANON_KEY` ao invés de `SUPABASE_SERVICE_ROLE_KEY`), fazendo a autorização falhar.

---

## Etapas de Correção

### 1. Corrigir autorização na chamada da formatação
**Arquivo:** `supabase/functions/raspar-resenha-diaria/index.ts`

- Trocar `SUPABASE_ANON_KEY` por `SUPABASE_SERVICE_ROLE_KEY` na chamada para `automacao-formatacao-leis`
- Isso permitirá que a formatação seja executada automaticamente após cada raspagem

### 2. Criar cron job para formatação automática
**Ação:** Criar job no pg_cron via SQL

- Adicionar um cron job que execute `automacao-formatacao-leis` a cada 30 minutos
- Isso garante que leis pendentes sejam processadas mesmo se a chamada direta falhar
- O job processará leis em lotes de 10, gradualmente limpando o backlog

### 3. Aumentar capacidade de processamento
**Arquivo:** `supabase/functions/automacao-formatacao-leis/index.ts`

- Aumentar o limite de 10 para 25 leis por execução
- Adicionar parâmetro `limite` no body para permitir controle externo

---

## Detalhes Técnicos

### Correção no raspar-resenha-diaria (linha ~454)

Antes:
```javascript
'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY') || ''}`,
```

Depois:
```javascript
'Authorization': `Bearer ${supabaseKey}`,
```

### SQL para criar cron job de formatação

```sql
SELECT cron.schedule(
  'automacao-formatacao-leis-30min',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url:='https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/automacao-formatacao-leis',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer [SERVICE_ROLE_KEY]"}'::jsonb,
    body:='{"limite": 20}'::jsonb
  );
  $$
);
```

---

## Resultado Esperado

Após as correções:
- Novas leis serão processadas automaticamente após raspagem
- Cron job de backup processará pendentes a cada 30 minutos
- O backlog de 868 leis será processado gradualmente (~1-2 dias)
- A Resenha Diária voltará a mostrar leis atualizadas

---

## Ação Imediata Opcional

Se quiser ver resultados mais rápidos, posso também criar um script para processar o backlog existente em lotes maiores, limpando as 868 leis pendentes de uma vez.
