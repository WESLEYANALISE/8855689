
# Correção: Usuários Premium vendo tela de escolha de plano

## Problema
Quando um usuário Premium faz login (especialmente em dispositivo novo sem localStorage), ocorre uma race condition:

1. Auth carrega -> usuário existe
2. Perfil carrega -> onboarding completo
3. `planChosen` verifica: `hasPlanChosen()` (localStorage = FALSE em novo dispositivo) OU `isPremium` (ainda carregando = FALSE)
4. `ProtectedRoute` vê `planChosen = false` -> redireciona para `/escolher-plano`

O `useOnboardingStatus` usa `isPremium` do `SubscriptionContext`, mas não espera o `loading` da assinatura terminar antes de retornar o resultado.

## Solução
Incluir o estado de `loading` do `SubscriptionContext` no `isLoading` retornado pelo `useOnboardingStatus`. Assim, o `ProtectedRoute` aguarda a verificação da assinatura terminar antes de decidir se redireciona.

## Arquivo a editar

**`src/hooks/useOnboardingStatus.ts`**
- Importar `loading` do `useSubscription()` (já importa `isPremium`)
- Incluir `loading` da assinatura no cálculo do `isLoading` retornado
- Mudança: `isLoading` passa a ser `profileLoading || subscriptionLoading`

## Mudança específica

```typescript
// ANTES:
const { isPremium } = useSubscription();
const [isLoading, setIsLoading] = useState(true);
// ...
return { isComplete, planChosen, isLoading, profile, refetch: fetchProfile };

// DEPOIS:
const { isPremium, loading: subscriptionLoading } = useSubscription();
const [isLoading, setIsLoading] = useState(true);
// ...
return { 
  isComplete, 
  planChosen, 
  isLoading: isLoading || subscriptionLoading,  // Espera ambos
  profile, 
  refetch: fetchProfile 
};
```

## Impacto
- O `ProtectedRoute` já espera `onboardingLoading` (que agora inclui subscription loading)
- Usuários Premium não serão mais redirecionados para `/escolher-plano` erroneamente
- Nenhuma mudança visual -- apenas garante que o loading screen permanece até a verificação Premium completar
