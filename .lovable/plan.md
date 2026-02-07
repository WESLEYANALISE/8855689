
# Plano: Redesign da Página de Assinatura como Landing Page de Vendas

## Visão Geral

Transformar a página de assinatura atual em uma **landing page de vendas profissional** com:
1. Título e subtítulo persuasivos que engajam o usuário
2. Lista de benefícios claros na área do valor
3. Opções de pagamento PIX e Cartão no modal de detalhes
4. Parcelamento em até 10x com taxa do Mercado Pago
5. Design elegante e informativo

---

## 1. Título e Subtítulo Persuasivos

### Problema Atual
A página mostra apenas uma frase de impacto aleatória, sem contexto de vendas direto.

### Solução
Adicionar uma seção de **headline** acima do card do plano com:

```text
Título: "Domine o Direito. Conquiste a Aprovação."
Subtítulo: "Acesso completo e vitalício a todo o conteúdo que você precisa para se tornar um jurista de excelência."
```

Alternativas de título (persuasivos):
- "Seu investimento mais inteligente no Direito"
- "Tudo o que você precisa. Para sempre."
- "A ferramenta definitiva para estudantes e advogados"

---

## 2. Lista de Benefícios no Card do Plano

### Problema Atual
O card mostra apenas "Acesso vitalício para sempre" - pouco persuasivo.

### Solução
Adicionar **3-4 benefícios-chave** visíveis diretamente no card:

```text
- Acesso ilimitado a todo conteúdo
- +30.000 questões OAB comentadas
- Professora IA Evelyn 24h
- Sem anúncios, para sempre
```

---

## 3. Opções de Pagamento: PIX + Cartão

### Problema Atual
Modal só oferece PIX, sem opção de cartão.

### Solução
Adicionar **toggle de método de pagamento** no modal:

| Método | Valor | Observação |
|--------|-------|------------|
| PIX | R$ 89,90 | À vista, aprovação instantânea |
| Cartão 1x | R$ 89,90 | Sem juros |
| Cartão 10x | R$ 10,81/parcela | Total: R$ 108,09 (com juros) |

### Cálculo das Parcelas

Com base nas taxas do Mercado Pago (tabela "Na Hora - Até R$3 mil"):
- Taxa para 10x: **20,24%**
- R$ 89,90 × 1,2024 = **R$ 108,09**
- Parcela: R$ 108,09 ÷ 10 = **R$ 10,81**

---

## 4. Arquivos a Modificar

### 4.1 PlanoCardNovo.tsx
- Adicionar lista de benefícios compacta (3-4 itens)
- Mostrar opção de parcelamento no card
- Visual mais vendedor

### 4.2 PlanoDetalhesModal.tsx
- Adicionar ToggleGroup para PIX / Cartão
- Mostrar opções de parcelamento para cartão
- Calcular e exibir valor com juros
- Manter botão de cartão funcional

### 4.3 Assinatura.tsx
- Adicionar seção de headline persuasiva
- Melhorar hierarquia visual
- Adicionar badges de benefícios

### 4.4 CheckoutCartao.tsx
- Expandir opções de parcelamento (até 10x)
- Mostrar valor total com juros
- Calcular automaticamente com taxa do MP

---

## 5. Detalhes Técnicos

### 5.1 Configuração de Parcelas

```typescript
const INSTALLMENT_CONFIG = {
  // Taxa do Mercado Pago para até R$3mil
  rates: {
    1: 0, // sem juros
    2: 0.0990, // 9.90%
    3: 0.1128, // 11.28%
    4: 0.1264, // 12.64%
    5: 0.1397, // 13.97%
    6: 0.1527, // 15.27%
    7: 0.1655, // 16.55%
    8: 0.1781, // 17.81%
    9: 0.1904, // 19.04%
    10: 0.2024, // 20.24%
  },
  basePrice: 89.90
};

const calculateInstallment = (installments: number) => {
  const rate = INSTALLMENT_CONFIG.rates[installments] || 0;
  const total = INSTALLMENT_CONFIG.basePrice * (1 + rate);
  const perInstallment = total / installments;
  return { total, perInstallment };
};
```

### 5.2 Layout do Modal Atualizado

```text
[Imagem de capa horizontal]

🏆 Plano Premium
Vitalício
R$ 89,90

┌────────────────────────────────┐
│  PIX           │    Cartão    │  ← Toggle
└────────────────────────────────┘

[Se PIX selecionado]
• R$ 89,90 à vista
• Aprovação instantânea
[Botão: Pagar com PIX]

[Se Cartão selecionado]
Parcelas:
○ 1x de R$ 89,90 (sem juros)
○ 2x de R$ 49,39 (total: R$ 98,79)
○ 3x de R$ 33,74 (total: R$ 101,24)
...
○ 10x de R$ 10,81 (total: R$ 108,09)

[Botão: Pagar com Cartão]
```

### 5.3 Headlines na Página Principal

```tsx
// Entre a narração e o card do plano
<div className="text-center mb-8">
  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3">
    Domine o Direito. Conquiste a Aprovação.
  </h1>
  <p className="text-zinc-400 text-sm sm:text-base max-w-md mx-auto">
    Acesso completo e vitalício a todo o conteúdo que você precisa.
  </p>
</div>

// Benefícios em badges
<div className="flex flex-wrap justify-center gap-2 mb-6">
  <Badge>+30.000 questões OAB</Badge>
  <Badge>Professora IA 24h</Badge>
  <Badge>Sem anúncios</Badge>
  <Badge>Vade Mecum completo</Badge>
</div>
```

---

## 6. Visual Final Esperado

### Página de Assinatura

```text
┌─────────────────────────────────────┐
│            [← Voltar]               │
│                                     │
│         [Hero Image]                │
│                                     │
│    "Frase de impacto narrada"       │
│                                     │
│ ══════════════════════════════════  │
│                                     │
│   Domine o Direito.                 │
│   Conquiste a Aprovação.            │
│                                     │
│   Acesso completo e vitalício...    │
│                                     │
│   [🏆 Questões] [🤖 IA] [📚 Vade]   │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  OFERTA ESPECIAL                │ │
│ │  ⭐ RECOMENDADO                 │ │
│ │  Vitalício                      │ │
│ │                                 │ │
│ │  ✓ Acesso ilimitado             │ │
│ │  ✓ +30.000 questões             │ │
│ │  ✓ IA 24h                       │ │
│ │                                 │ │
│ │  R$ 89,90 à vista               │ │
│ │  ou 10x de R$ 10,81             │ │
│ │                                 │ │
│ │  [Ver mais →]                   │ │
│ └─────────────────────────────────┘ │
│                                     │
│   🔒 Pagamento seguro via MP        │
│                                     │
│                          [WhatsApp] │
└─────────────────────────────────────┘
```

### Modal de Detalhes

```text
┌─────────────────────────────────────┐
│               [X]                   │
│         [Capa Horizontal]           │
│                                     │
│ 🏆 Plano Premium                    │
│ Vitalício                           │
│ R$ 89,90                            │
│                                     │
│ ┌───────────────┬─────────────────┐ │
│ │  ⚡ PIX       │   💳 Cartão     │ │
│ └───────────────┴─────────────────┘ │
│                                     │
│ [Se Cartão]                         │
│ ○ 1x R$ 89,90 (sem juros)           │
│ ● 10x R$ 10,81 (total R$ 108,09)    │
│                                     │
│ [═══ Pagar com Cartão →═══]         │
│                                     │
│ ┌─────────────┬─────────────┐       │
│ │  Funções    │   Sobre     │       │
│ └─────────────┴─────────────┘       │
│                                     │
│ ✓ Acesso completo e ilimitado       │
│ ✓ Experiência 100% sem anúncios     │
│ ✓ Professora IA Evelyn 24h          │
│ ...                                 │
└─────────────────────────────────────┘
```

---

## Resumo das Mudanças

| Componente | Mudança |
|------------|---------|
| `Assinatura.tsx` | Adicionar headline, subtítulo e badges de benefícios |
| `PlanoCardNovo.tsx` | Mostrar benefícios + opção de parcelamento |
| `PlanoDetalhesModal.tsx` | Toggle PIX/Cartão + seletor de parcelas |
| `CheckoutCartao.tsx` | Expandir para 10x com cálculo de juros |

---

## Resultado Esperado

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Headline | Apenas frase aleatória | Título + subtítulo persuasivos |
| Benefícios | Escondidos no modal | Visíveis no card principal |
| Pagamento | Só PIX | PIX + Cartão (até 10x) |
| Parcelamento | Não disponível | 10x de R$ 10,81 |
| Visual | Funcional | Landing page de vendas |
