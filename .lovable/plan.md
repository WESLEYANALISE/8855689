

## Plano: Bloqueio de Acesso para Usuários com Período de Teste Encerrado

### O que vai acontecer

Usuários cadastrados **até o dia 8 de fevereiro de 2026** que **não possuem plano Premium** verão uma tela informando que o período de teste acabou. Eles só poderão acessar a **página de assinatura** para escolher um plano. O restante do app ficará bloqueado até a compra.

Usuários cadastrados **após o dia 8** continuam usando normalmente (período de teste ativo). Usuários **Premium** não são afetados.

---

### Etapas

1. **Criar hook `useTrialStatus`**
   - Verifica a data de criação do usuário (`user.created_at`) e o status Premium do `SubscriptionContext`
   - Retorna `trialExpired: true` se o usuário foi criado em ou antes de 08/02/2026 e não é Premium

2. **Criar componente `TrialExpiredGuard`**
   - Envolve as rotas protegidas
   - Se `trialExpired === true` e a rota atual **não é** `/assinatura`, `/assinatura/checkout`, `/assinatura/callback` ou `/perfil`, redireciona para `/assinatura`
   - Exibe um banner/toast informando que o período de teste encerrou

3. **Integrar no `ProtectedRoute`**
   - Após as verificações de autenticação e onboarding, adicionar a verificação de trial expirado
   - Se expirado, redireciona para `/assinatura`

4. **Tela de assinatura com aviso**
   - Adicionar um banner no topo da página de assinatura quando o usuário tem trial expirado, com mensagem clara: "Seu período de teste encerrou. Escolha um plano para continuar."

---

### Detalhes Técnicos

**Novo arquivo: `src/hooks/useTrialStatus.ts`**
- Usa `useAuth()` para pegar `user.created_at`
- Usa `useSubscription()` para pegar `isPremium` e `loading`
- Data de corte: `2026-02-08T23:59:59`
- Retorna `{ trialExpired, loading }`

**Modificação: `src/components/auth/ProtectedRoute.tsx`**
- Importa `useTrialStatus`
- Após checar auth e onboarding, checa `trialExpired`
- Rotas permitidas mesmo com trial expirado: `/assinatura`, `/assinatura/checkout`, `/assinatura/callback`, `/configuracoes`, `/perfil`
- Se trial expirado e rota não permitida: `<Navigate to="/assinatura" />`

**Modificação: `src/pages/Assinatura.tsx`**
- Detecta via `useTrialStatus` se o usuário chegou por trial expirado
- Mostra banner vermelho/amarelo no topo: "Seu período de teste encerrou! Escolha um plano abaixo para continuar acessando o app."

