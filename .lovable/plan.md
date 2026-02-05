
# Plano: Apenas Plano Vitalício R$89,90 + Ativar Premium da Mel

## Resumo das Mudanças

### 1. Ativar Premium da usuária Mel
- Atualizar o status da assinatura de `pending` para `authorized` no banco de dados
- User ID: `f6c3e6b9-aa69-456b-920e-d2698bc80c0d`

### 2. Remover Plano Mensal - Deixar Apenas Vitalício R$89,90

Vou modificar todos os arquivos onde o plano mensal está definido:

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Assinatura.tsx` | Remover `mensal` do PLANS, manter apenas `vitalicio: { price: 89.90, ... }` e remover o card do plano mensal |
| `src/hooks/use-mercadopago-pix.ts` | Alterar tipo `PlanType = 'vitalicio'` (apenas vitalício) |
| `supabase/functions/mercadopago-criar-pix/index.ts` | Remover plano mensal, manter apenas vitalício R$89,90 |
| `supabase/functions/evelyn-gerar-pix/index.ts` | Remover plano mensal, manter apenas vitalício R$89,90 |
| `src/hooks/use-assinatura-experiencia.ts` | Remover referência a `mensal` nas imagens |
| `src/components/AssinaturaGerenciamento.tsx` | Atualizar para mostrar "Premium Vitalício" |
| `src/pages/MinhaAssinatura.tsx` | Atualizar labels para vitalício |
| `src/components/PremiumUpgradeModal.tsx` | Atualizar preço para R$89,90 |

---

## Detalhes Técnicos

### Página de Assinatura (`src/pages/Assinatura.tsx`)

**Antes:**
```typescript
const PLANS: Record<PlanType, PlanConfig> = {
  mensal: { price: 17.99, label: 'Mensal', days: 30, badge: null },
  vitalicio: { price: 79.90, label: 'Vitalício', days: 36500, badge: 'MAIS POPULAR', featured: true }
};
```

**Depois:**
```typescript
const PLANS: Record<PlanType, PlanConfig> = {
  vitalicio: { price: 89.90, label: 'Vitalício', days: 36500, badge: 'OFERTA ESPECIAL', featured: true }
};
```

- Remover o grid de 2 colunas, deixar apenas 1 card centralizado
- Remover o `PlanoCardNovo` do mensal

### Edge Functions (mercadopago-criar-pix e evelyn-gerar-pix)

**Antes:**
```typescript
const PLANS = {
  mensal: { amount: 15.90, days: 30, description: 'Direito Premium - Mensal' },
  vitalicio: { amount: 89.90, days: 36500, description: 'Direito Premium - Vitalício' }
};
```

**Depois:**
```typescript
const PLANS = {
  vitalicio: { amount: 89.90, days: 36500, description: 'Direito Premium - Vitalício' }
};
```

### Tipo PlanType (`src/hooks/use-mercadopago-pix.ts`)

**Antes:**
```typescript
export type PlanType = 'mensal' | 'vitalicio';
```

**Depois:**
```typescript
export type PlanType = 'vitalicio';
```

### Modal de Upgrade Premium

**Antes:**
```tsx
Ver planos a partir de R$ 21,90/mês
```

**Depois:**
```tsx
Assinar por R$ 89,90 (acesso vitalício)
```

---

## Resultado Esperado

1. ✅ Mel Pereira Alves terá acesso Premium ativado imediatamente
2. ✅ Página de assinatura mostrará apenas o plano vitalício de R$89,90
3. ✅ Ao pagar, usuário receberá acesso vitalício (36500 dias = ~100 anos)
4. ✅ Tela de sucesso mostrará "Acesso Vitalício" em vez de "Mensal"
5. ✅ Edge Functions aceitarão apenas `planType: 'vitalicio'`
