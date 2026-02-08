
# Plano: Adicionar Planos Mensal e Anual ao Premium

## Resumo Executivo

Adicionar dois novos planos de assinatura (Mensal e Anual) mantendo o Vitalício existente. Usuários que já são vitalícios continuam com acesso vitalício.

---

## Estrutura dos Novos Planos

| Plano | Preço | Duração | PIX | Cartão | Parcelamento | Destaque |
|-------|-------|---------|-----|--------|--------------|----------|
| **Mensal** | R$ 17,99 | 30 dias | Não | Sim (1x) | Não | - |
| **Anual** | R$ 69,90 | 365 dias | Sim | Sim | Até 10x | "Mais escolhido" |
| **Vitalício** | R$ 119,90 | Para sempre | Sim | Sim | Até 10x | "Melhor custo-benefício" |

---

## Arquivos a Modificar

### 1. Tipos e Configurações

**`src/hooks/use-mercadopago-pix.ts`**
- Expandir `PlanType` de `'vitalicio'` para `'mensal' | 'anual' | 'vitalicio'`

**`src/pages/Assinatura.tsx`**
- Adicionar os 3 planos ao objeto `PLANS`:
  ```typescript
  const PLANS: Record<PlanType, PlanConfig> = {
    mensal: { price: 17.99, label: 'Mensal', days: 30, badge: null },
    anual: { price: 69.90, label: 'Anual', days: 365, badge: 'MAIS ESCOLHIDO', featured: true },
    vitalicio: { price: 119.90, label: 'Vitalício', days: 36500, badge: 'MELHOR CUSTO-BENEFÍCIO' }
  };
  ```
- Renderizar os 3 cards de plano na página

### 2. Componentes de UI

**`src/components/assinatura/PlanoCardNovo.tsx`**
- Adicionar prop `paymentMethods` para indicar métodos disponíveis (PIX/Cartão)
- Mostrar badge "Mais escolhido" no plano anual

**`src/components/assinatura/PlanoDetalhesModal.tsx`**
- Importar capas horizontais para mensal e anual
- Condicionar opção de PIX por plano (mensal = só cartão)
- Ajustar textos para cada tipo de plano

**`src/hooks/use-assinatura-experiencia.ts`**
- Expandir `planImages` para incluir mensal e anual
- Usar imagens já existentes: `assinatura-mensal-horizontal.webp` e `assinatura-trimestral-horizontal.webp` (renomear para anual)

### 3. Edge Functions (Backend)

**`supabase/functions/mercadopago-criar-pix/index.ts`**
- Adicionar plano anual e vitalício com novos preços:
  ```typescript
  const PLANS = {
    anual: { amount: 69.90, days: 365, description: 'Direito Premium - Anual' },
    vitalicio: { amount: 119.90, days: 36500, description: 'Direito Premium - Vitalício' }
  };
  ```
- Mensal não terá PIX (só cartão)

**`supabase/functions/mercadopago-criar-pagamento-cartao/index.ts`**
- Adicionar os 3 planos:
  ```typescript
  const PLANS = {
    mensal: { amount: 17.99, days: 30, description: 'Direito Premium - Mensal' },
    anual: { amount: 69.90, days: 365, description: 'Direito Premium - Anual' },
    vitalicio: { amount: 119.90, days: 36500, description: 'Direito Premium - Vitalício' }
  };
  ```

### 4. Geração de Capas

**`supabase/functions/gerar-capa-plano-horizontal/index.ts`**
- Atualizar prompts para os novos planos (mensal, anual, vitalício)

### 5. Correção do Bug de Build

**`src/pages/Bibliotecas.tsx`** e **`src/components/GlobalImagePreloader.tsx`**
- Corrigir `fetchPriority` para `fetchpriority` (lowercase) para evitar warning do React

---

## Lógica de Métodos de Pagamento

```text
┌─────────────────────────────────────────────────────────────┐
│  MENSAL (R$ 17,99)                                          │
│  └── Apenas Cartão (1x sem juros)                           │
│       └── Não mostra toggle PIX/Cartão                      │
├─────────────────────────────────────────────────────────────┤
│  ANUAL (R$ 69,90) ★ MAIS ESCOLHIDO                          │
│  └── PIX à vista OU Cartão até 10x                          │
│       └── Toggle PIX/Cartão visível                         │
├─────────────────────────────────────────────────────────────┤
│  VITALÍCIO (R$ 119,90)                                      │
│  └── PIX à vista OU Cartão até 10x                          │
│       └── Toggle PIX/Cartão visível                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Assets Utilizados

Imagens já existentes no projeto:
- `assinatura-mensal-horizontal.webp` → Plano Mensal
- `assinatura-trimestral-horizontal.webp` → Plano Anual (reutilizar)
- `assinatura-vitalicio-horizontal.webp` → Plano Vitalício

---

## Seção Técnica

### Alterações no Type System

```typescript
// use-mercadopago-pix.ts
export type PlanType = 'mensal' | 'anual' | 'vitalicio';

// Assinatura.tsx
interface PlanConfig {
  price: number;
  label: string;
  days: number;
  badge: string | null;
  featured?: boolean;
  savings?: string;
  pixEnabled?: boolean; // Nova prop
}
```

### Condicionais de Pagamento no Modal

```typescript
// PlanoDetalhesModal.tsx
const showPixOption = plano !== 'mensal'; // Mensal só cartão

// Se mensal, força paymentMethod = 'cartao' e esconde toggle
useEffect(() => {
  if (plano === 'mensal') {
    setPaymentMethod('cartao');
  }
}, [plano]);
```

### Edge Function - Validação de PIX

```typescript
// mercadopago-criar-pix/index.ts
const PLANS = {
  anual: { amount: 69.90, days: 365, description: 'Direito Premium - Anual' },
  vitalicio: { amount: 119.90, days: 36500, description: 'Direito Premium - Vitalício' }
  // mensal NÃO incluído - PIX não disponível
};

// Rejeitar mensal
if (planType === 'mensal') {
  return new Response(
    JSON.stringify({ error: 'PIX não disponível para plano mensal' }),
    { status: 400, ... }
  );
}
```

---

## Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/use-mercadopago-pix.ts` | Expandir PlanType para 3 planos |
| `src/pages/Assinatura.tsx` | Renderizar 3 cards, atualizar PLANS |
| `src/components/assinatura/PlanoCardNovo.tsx` | Adicionar badge "Mais escolhido" |
| `src/components/assinatura/PlanoDetalhesModal.tsx` | Condicionar PIX, importar capas |
| `src/hooks/use-assinatura-experiencia.ts` | Expandir planImages |
| `supabase/functions/mercadopago-criar-pix/index.ts` | Adicionar plano anual, atualizar vitalício |
| `supabase/functions/mercadopago-criar-pagamento-cartao/index.ts` | Adicionar 3 planos com novos preços |
| `supabase/functions/gerar-capa-plano-horizontal/index.ts` | Atualizar prompts |
| `src/pages/Bibliotecas.tsx` | Corrigir fetchPriority → fetchpriority |

---

## Impacto Esperado

| Antes | Depois |
|-------|--------|
| 1 plano (Vitalício R$ 89,90) | 3 planos (Mensal, Anual, Vitalício) |
| Apenas PIX + Cartão | Mensal só cartão, outros PIX + Cartão |
| Sem destaque de popularidade | Anual com badge "Mais escolhido" |
| Preço vitalício R$ 89,90 | Preço vitalício R$ 119,90 |
