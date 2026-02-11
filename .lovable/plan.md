
# Rastreamento de Eventos do Facebook Ads

## Objetivo
Implementar rastreamento completo de eventos do Facebook Ads no aplicativo, utilizando tanto o **Meta Pixel (frontend)** quanto a **API de Conversoes (server-side)** para maximizar a precisao dos dados enviados ao Facebook Ads. Os eventos mais importantes serao focados no funil de conversao da assinatura Vitalicia.

---

## Eventos a Rastrear

| Evento Facebook | Quando dispara | Prioridade |
|---|---|---|
| `PageView` | Toda navegacao de pagina (ja funciona via `index.html`) | Ja implementado |
| `CompleteRegistration` | Usuario cria conta com sucesso | Alta |
| `ViewContent` | Abre a pagina de assinatura (`/assinatura`) ou escolher plano (`/escolher-plano`) | Alta |
| `AddToCart` | Clica em "Ver mais detalhes" no plano Vitalicio (abre o modal) | Alta |
| `InitiateCheckout` | Clica em "Pagar com PIX" ou "Pagar com Cartao" no modal | Alta |
| `Purchase` | Pagamento aprovado (tela de sucesso aparece) | Critica |
| `Lead` | Abre o chat da Consultora Premium | Media |

---

## Arquitetura

Cada evento sera enviado de duas formas simultaneas (deduplicacao via `event_id`):

1. **Pixel (frontend):** `fbq('track', 'EventName', data)` -- rapido, captura cookies do navegador
2. **API de Conversoes (server-side):** via edge function `facebook-conversions` -- confiavel, nao bloqueado por ad-blockers

---

## Detalhes Tecnicos

### 1. Criar hook `useFacebookPixel`
**Novo arquivo: `src/hooks/useFacebookPixel.ts`**

Um hook centralizado que:
- Expoe funcao `trackEvent(eventName, customData?, userData?)` 
- Gera um `event_id` unico para deduplicacao (mesmo ID vai para o Pixel e para a API)
- Dispara `fbq('track', ...)` no frontend com o `eventID`
- Envia simultaneamente para a edge function `facebook-conversions` com o mesmo `event_id`
- Inclui dados do usuario logado (email hashado) quando disponivel
- Tipa o `fbq` global no `window` para evitar erros TypeScript

### 2. Integrar nos pontos de conversao

**a) `src/pages/Auth.tsx`** -- Evento `CompleteRegistration`
- Apos `supabase.auth.signUp()` retornar sucesso (sem erro), disparar `CompleteRegistration`
- Dados: `{ content_name: 'Signup', status: true }`

**b) `src/pages/Assinatura.tsx`** -- Evento `ViewContent`
- Ao montar a pagina (e nao ser Premium), disparar `ViewContent`
- Dados: `{ content_name: 'Assinatura Premium', content_category: 'subscription', currency: 'BRL', value: 89.90 }`

**c) `src/pages/EscolherPlano.tsx`** -- Evento `ViewContent`
- Ao montar a pagina, disparar `ViewContent`
- Dados: `{ content_name: 'Escolher Plano', content_category: 'subscription' }`

**d) `src/components/assinatura/PlanoDetalhesModal.tsx`** -- Evento `AddToCart`
- Quando o modal abre (ja tem o `trackPlanClick` no `useEffect`), disparar `AddToCart`
- Dados: `{ content_name: 'Plano Vitalicio', content_type: 'product', currency: 'BRL', value: 89.90 }`

**e) `src/components/assinatura/PlanoDetalhesModal.tsx`** -- Evento `InitiateCheckout`
- Quando clica em "Pagar com PIX" ou "Pagar com Cartao" (funcao `handlePaymentClick`), disparar `InitiateCheckout`
- Dados: `{ content_name: 'Plano Vitalicio', currency: 'BRL', value: 89.90, payment_method: 'pix' ou 'cartao' }`

**f) `src/components/assinatura/PixPaymentScreen.tsx`** -- Evento `Purchase` (via PIX)
- Quando `isPremium` muda para `true` (pagamento aprovado), disparar `Purchase`
- Dados: `{ content_name: 'Plano Vitalicio', currency: 'BRL', value: 89.90 }`

**g) `src/components/assinatura/CheckoutCartao.tsx`** -- Evento `Purchase` (via Cartao)
- Quando pagamento retorna `data.status === 'approved'`, disparar `Purchase`
- Dados: `{ content_name: 'Plano Vitalicio', currency: 'BRL', value: amount }`

**h) `src/components/assinatura/ConsultoraChatModal.tsx`** -- Evento `Lead`
- Quando abre o chat da consultora, disparar `Lead`
- Dados: `{ content_name: 'Consultora Premium Chat' }`

### 3. Atualizar a Edge Function `facebook-conversions`
- Adicionar suporte ao campo `event_id` para deduplicacao (Facebook usa isso para nao contar duplicatas entre Pixel e API)
- Incluir `event_source_url` automaticamente baseado no referer

### 4. Tipagem TypeScript
- Declarar `fbq` no `window` via interface global para evitar erros de compilacao

---

## Arquivos Modificados/Criados

| Arquivo | Acao |
|---|---|
| `src/hooks/useFacebookPixel.ts` | **Criar** -- hook central |
| `src/pages/Auth.tsx` | Editar -- adicionar `CompleteRegistration` |
| `src/pages/Assinatura.tsx` | Editar -- adicionar `ViewContent` |
| `src/pages/EscolherPlano.tsx` | Editar -- adicionar `ViewContent` |
| `src/components/assinatura/PlanoDetalhesModal.tsx` | Editar -- adicionar `AddToCart` + `InitiateCheckout` |
| `src/components/assinatura/PixPaymentScreen.tsx` | Editar -- adicionar `Purchase` |
| `src/components/assinatura/CheckoutCartao.tsx` | Editar -- adicionar `Purchase` |
| `src/components/assinatura/ConsultoraChatModal.tsx` | Editar -- adicionar `Lead` |
| `supabase/functions/facebook-conversions/index.ts` | Editar -- suporte a `event_id` |

---

## Funil Completo no Facebook Ads

```text
PageView (automatico)
    |
    v
CompleteRegistration (criou conta)
    |
    v
ViewContent (acessou pagina de assinatura)
    |
    v
AddToCart (abriu detalhes do plano vitalicio)
    |
    v
InitiateCheckout (clicou em pagar)
    |
    v
Purchase (pagamento aprovado)
```

Isso permitira criar campanhas otimizadas para cada etapa do funil diretamente no Facebook Ads Manager.
