

## Corrigir 3 Problemas: Animacao Premium, Tela de Plano e Botao de Capa Admin

### Problema 1: Animacao de sucesso apos pagamento

A animacao com confetti (PremiumSuccessCard) ja existe e esta integrada nos componentes de pagamento (PaymentMonitor, PixPaymentScreen, CheckoutCartao). Porem, pode nao estar aparecendo corretamente se o estado do pagamento nao for detectado a tempo. Sera verificado e garantido que a animacao apareca imediatamente apos a confirmacao do pagamento.

**Acao**: Revisar o fluxo nos 3 componentes de pagamento para garantir que o PremiumSuccessCard apareca de forma confiavel quando `isPremium` mudar para `true`.

---

### Problema 2: Botao "Premium" no menu nao mostra o plano

O botao "Premium" no sidebar navega para `/assinatura`. Para usuarios Premium, a pagina renderiza o componente `AssinaturaGerenciamento`, que mostra detalhes do plano (nome, valor, validade, suporte). Porem, existe um `useEffect` que redireciona usuarios Premium para a home quando a pagina e carregada, impedindo que vejam a tela de gerenciamento.

**Acao**: Remover o redirecionamento automatico de usuarios Premium na pagina `/assinatura` (linhas 74-82 de `Assinatura.tsx`). Assim, ao clicar em "Premium" no menu, o usuario vera seus detalhes do plano: tipo vitalicio, data do pagamento, e-mail de suporte, etc.

Tambem sera adicionada a **data do pagamento** ao `AssinaturaGerenciamento`, que atualmente nao exibe essa informacao.

**Arquivo**: `src/pages/Assinatura.tsx` - remover useEffect de redirecionamento

**Arquivo**: `src/components/AssinaturaGerenciamento.tsx` - adicionar card com data do pagamento (usando `subscription.createdAt`)

---

### Problema 3: Botao "Gerar Capa" aparece para todos os Premium (deve ser so admin)

Nas paginas OAB Trilhas, Conceitos e Dominando, o botao "Gerar Capa" / "Regenerar Capa" aparece para qualquer usuario Premium (`isPremium`). Deve aparecer apenas para o admin (`wn7corporation@gmail.com`).

**Arquivos afetados**:
- `src/pages/oab/TrilhasAprovacao.tsx` - trocar `isPremium` por `isAdmin` no botao de gerar/regenerar capa
- `src/pages/ConceitosTrilhante.tsx` - trocar logica para `isAdmin`
- `src/pages/DominandoTrilhas.tsx` - trocar logica para `isAdmin`

Em cada arquivo, sera adicionada a verificacao `const isAdmin = user?.email === 'wn7corporation@gmail.com'` e substituidas as condicoes `isPremium` por `isAdmin` nos botoes de geracao de capa.

---

### Resumo das mudancas

| Arquivo | Mudanca |
|---|---|
| `src/pages/Assinatura.tsx` | Remover redirecionamento automatico de Premium |
| `src/components/AssinaturaGerenciamento.tsx` | Adicionar data do pagamento ao card |
| `src/pages/oab/TrilhasAprovacao.tsx` | Botao "Gerar Capa" so para admin |
| `src/pages/ConceitosTrilhante.tsx` | Botao "Gerar Capa" so para admin |
| `src/pages/DominandoTrilhas.tsx` | Botao "Gerar Capa" so para admin |

