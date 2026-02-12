

# Adicionar Plano Pro (R$19,90/mes) ao Sistema de Assinaturas

## Visao Geral

O sistema passara a ter 4 opcoes:

1. **Gratuito** -- R$0
2. **Essencial** -- R$14,99/mes (tudo menos Evelyn)
3. **Pro** -- R$19,90/mes (tudo + Evelyn)
4. **Vitalicio** -- R$89,90 pagamento unico (tudo + Evelyn, para sempre)

## Mudancas

### 1. Backend: `supabase/functions/mercadopago-criar-assinatura/index.ts`
- Adicionar bloco para `planType === 'pro'` com Preapproval recorrente de R$19,90/mes
- Mesmo padrao do bloco `essencial`, mas com `transaction_amount: 19.90` e `reason: 'Direito Premium - Plano Pro'`
- Salvar no banco com `plan_type: 'pro'` e `amount: 19.90`

### 2. Backend: `supabase/functions/mercadopago-verificar-assinatura/index.ts`
- Atualizar logica de `hasEvelynAccess`: retornar `true` para `vitalicio` **e** `pro`
- Linha atual: `subscription.plan_type === 'vitalicio'`
- Nova logica: `subscription.plan_type === 'vitalicio' || subscription.plan_type === 'pro'`

### 3. Frontend: `src/hooks/use-mercadopago-pix.ts`
- Adicionar `'pro'` ao tipo `PlanType`: `'mensal' | 'anual' | 'vitalicio' | 'essencial' | 'pro'`

### 4. Frontend: `src/hooks/usePlanAnalytics.ts`
- Adicionar `'pro'` ao tipo `PlanType` local

### 5. Frontend: `src/hooks/use-assinatura-experiencia.ts`
- Adicionar `pro: mensalImage` ao record `planImages`

### 6. Frontend: `src/pages/EscolherPlano.tsx`
- Adicionar constante `PRO_FEATURES` (igual ao `LIFETIME_FEATURES` -- tudo incluso, incluindo Evelyn)
- Adicionar constante `PRO_ABOUT` descrevendo o plano
- Expandir tipo do `detailPlan` para incluir `'pro'`
- Adicionar card do Pro entre Essencial e Vitalicio, estilo roxo/violet para diferenciar
- Adicionar handler `handlePro` que chama `mercadopago-criar-assinatura` com `planType: 'pro'`
- Preco exibido: R$19,90/mes

### 7. Frontend: `src/pages/Assinatura.tsx`
- Adicionar `pro` ao `PLANS` Record com `price: 19.90, label: 'Pro', days: 30, badge: 'COM EVELYN', pixEnabled: false`

### 8. Frontend: `src/components/assinatura/PlanoCardNovo.tsx`
- Suportar plan type `pro` com estilo proprio (roxo/violet)

### 9. Frontend: `src/components/AssinaturaGerenciamento.tsx`
- Suportar exibicao do plano Pro (mensal, R$19,90, opcao de cancelar)

### 10. Frontend: `src/components/assinatura/PlanoDetalhesModal.tsx`
- Suportar detalhes do plano Pro

## Detalhes Tecnicos

### Tipo PlanType atualizado
```text
'mensal' | 'anual' | 'vitalicio' | 'essencial' | 'pro'
```

### Logica de acesso Evelyn
```text
hasEvelynAccess = isPremium AND (plan_type = 'vitalicio' OR plan_type = 'pro')
```

### Cores por plano
```text
Gratuito: zinc (cinza)
Essencial: blue/indigo (azul)
Pro: violet/purple (roxo)
Vitalicio: amber/yellow (dourado)
```

### Sequencia de implementacao
1. Atualizar edge functions (criar-assinatura + verificar-assinatura)
2. Atualizar PlanType em todos os hooks
3. Atualizar use-assinatura-experiencia com imagem do Pro
4. Atualizar EscolherPlano com 4 cards
5. Atualizar Assinatura (landing page)
6. Atualizar PlanoCardNovo e PlanoDetalhesModal
7. Atualizar AssinaturaGerenciamento
8. Deploy das edge functions
