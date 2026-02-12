

# Adicionar Plano Essencial (R$14,99/mes) ao Sistema de Assinaturas

## Visao Geral

Adicionar um novo plano **Essencial** de R$14,99/mes (recorrente via cartao) que da acesso a tudo EXCETO a Evelyn. O sistema passara a ter 3 opcoes:

1. **Gratuito** -- R$0
2. **Essencial** -- R$14,99/mes (tudo menos Evelyn)
3. **Vitalicio** -- R$89,90 pagamento unico (tudo incluindo Evelyn)

## Mudancas no Backend (Edge Functions)

### 1. `supabase/functions/mercadopago-criar-assinatura/index.ts`
- Atualizar o plano **mensal** para R$14,99 (atualmente R$21,90) e renomear internamente para "essencial"
- Ou criar um novo planType `essencial` que usa Preapproval do Mercado Pago a R$14,99/mes
- Manter `back_url` e `external_reference` com o novo tipo

### 2. `supabase/functions/mercadopago-criar-pix/index.ts`
- Adicionar plano `essencial` como opcao de pagamento avulso (primeiro mes via PIX, se desejado) OU manter apenas cartao para o essencial (recorrente)
- Decisao: como e recorrente, PIX nao se aplica -- manter apenas cartao

### 3. `supabase/functions/mercadopago-verificar-assinatura/index.ts`
- Retornar o campo `planType` na resposta (ja faz isso)
- Adicionar campo `hasEvelynAccess` baseado no plan_type:
  - `vitalicio` -> `hasEvelynAccess: true`
  - `essencial` -> `hasEvelynAccess: false`
  - Qualquer outro plan_type ativo -> verificar caso a caso

## Mudancas no Frontend

### 4. `src/contexts/SubscriptionContext.tsx`
- Adicionar `hasEvelynAccess: boolean` ao contexto
- Preencher baseado na resposta do backend (`subscription.planType === 'vitalicio'`)

### 5. `src/hooks/use-mercadopago-pix.ts`
- Adicionar `'essencial'` ao tipo `PlanType`

### 6. `src/pages/EscolherPlano.tsx`
- Adicionar card intermediario "Essencial" entre Gratuito e Vitalicio
- Funcionalidades do Essencial: tudo marcado como incluso EXCETO "Professora IA Evelyn disponivel 24h"
- Preco: R$14,99/mes
- Ao clicar "Confirmar escolha", chamar a edge function `mercadopago-criar-assinatura` com planType `essencial`
- Estilo do card: borda e cores em azul/indigo para diferenciar do dourado do Vitalicio

### 7. `src/pages/Assinatura.tsx` (Landing page de vendas)
- Adicionar o plano Essencial ao `PLANS` com preco R$14,99
- Exibir card do Essencial ao lado do Vitalicio
- Atualizar beneficios do marquee para diferenciar os planos

### 8. `src/components/assinatura/PlanoCardNovo.tsx`
- Suportar o novo plan type `essencial` com estilo proprio (azul/indigo)

### 9. Controle de Acesso da Evelyn
Arquivos que verificam acesso a Evelyn e precisam usar `hasEvelynAccess` em vez de `isPremium`:
- `src/pages/Evelyn.tsx` -- Tela principal da Evelyn
- `src/pages/ferramentas/EvelynWhatsApp.tsx` -- WhatsApp da Evelyn
- Qualquer outro componente que gate Evelyn

### 10. `src/components/AssinaturaGerenciamento.tsx`
- Mostrar informacoes corretas para o plano Essencial (mensal, R$14,99, opcao de cancelar)

## Listas de Funcionalidades por Plano

### Gratuito
- Chat Juridico (limitado)
- Flashcards (3 por dia)
- Dicionario Juridico
- Constituicao Federal
- Codigo Civil e Penal
- Noticias Juridicas
- Videoaulas (2 gratis)

### Essencial (R$14,99/mes)
- Tudo do Gratuito +
- Chat Juridico ilimitado
- Flashcards ilimitados
- Vade Mecum completo (+50 leis)
- +30.000 questoes OAB
- Mapas mentais
- Resumos inteligentes
- Simulados OAB
- Peticoes e contratos
- Audioaulas
- Sumulas vinculantes
- Trilhas OAB completas
- Biblioteca completa
- Sem anuncios
- ~~Evelyn (NAO inclusa)~~

### Vitalicio (R$89,90)
- Tudo do Essencial +
- Evelyn IA 24h no WhatsApp
- Acesso vitalicio para sempre
- Suporte prioritario

## Sequencia de Implementacao

1. Atualizar edge functions (verificar assinatura, criar assinatura)
2. Atualizar SubscriptionContext com `hasEvelynAccess`
3. Atualizar PlanType
4. Atualizar EscolherPlano com 3 cards
5. Atualizar pagina Assinatura
6. Atualizar controle de acesso da Evelyn
7. Deploy das edge functions

