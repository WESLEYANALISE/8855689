

## Corrigir e Mostrar Lista de Assinantes Premium no Dashboard

### Problema Atual
O "Total Premium" no dashboard admin nao mostra o numero correto porque a **politica RLS** da tabela `subscriptions` so permite que cada usuario veja suas proprias assinaturas. Alem disso, nao existe uma lista mostrando quem sao os assinantes.

### O que sera feito

**1. Adicionar politica RLS para admin ver todas as assinaturas**

Executar SQL no banco para permitir que o admin leia todos os registros:

```text
CREATE POLICY "Admin pode ver todas as assinaturas"
  ON subscriptions FOR SELECT
  USING (is_admin(auth.uid()));
```

**2. Criar hook para listar assinantes unicos com email e plano**

No arquivo `useAdminControleStats.ts`, adicionar um novo hook `useListaAssinantesPremium` que retorna:
- Email do usuario
- Plano assinado (mensal, anual, vitalicio)
- Valor pago
- Data da assinatura
- Status

A query vai buscar as assinaturas com status "authorized", agrupar por usuario unico (email), e mostrar a assinatura mais recente de cada um.

**3. Adicionar secao de assinantes no AdminControle**

Abaixo dos cards de Premium (Total Premium, Taxa Conversao, Media ate Premium), adicionar uma tabela/lista com:
- Coluna de email
- Coluna de plano
- Coluna de valor
- Coluna de data
- Badge de status
- Contagem total de assinantes unicos no topo

A lista tera scroll e sera ordenada por data (mais recente primeiro).

### Dados atuais no banco

Existem **50 assinaturas autorizadas**, mas muitas sao duplicadas do mesmo usuario. Os assinantes unicos reais sao aproximadamente **6 usuarios**:
- eloilson.leao@gmail.com (vitalicio)
- danilocostag19@gmail.com (vitalicio)
- wn7corporation@gmail.com (mensal/anual - multiplas)
- emillymaria2003@icloud.com (vitalicio)
- enagioaraujo@gmail.com (vitalicio)
- haverothmel@gmail.com (vitalicio)

### Arquivos modificados

- **Banco de dados**: Nova politica RLS na tabela `subscriptions`
- **`src/hooks/useAdminControleStats.ts`**: Novo hook `useListaAssinantesPremium` e atualizar interface `MetricasPremium` para incluir lista de assinantes
- **`src/pages/Admin/AdminControle.tsx`**: Nova secao abaixo dos cards mostrando a tabela de assinantes

