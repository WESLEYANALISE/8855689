import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';

const TRIAL_CUTOFF_DATE = new Date('2026-02-08T23:59:59');

const ALLOWED_ROUTES = [
  '/assinatura',
  '/assinatura/checkout',
  '/assinatura/callback',
  '/configuracoes',
  '/perfil',
];

interface TrialStatus {
  trialExpired: boolean;
  loading: boolean;
}

export const useTrialStatus = (): TrialStatus => {
  const { user, loading: authLoading } = useAuth();
  const { isPremium, loading: subLoading } = useSubscription();

  const loading = authLoading || subLoading;

  if (loading || !user) {
    return { trialExpired: false, loading };
  }

  const createdAt = new Date(user.created_at);
  const trialExpired = !isPremium && createdAt <= TRIAL_CUTOFF_DATE;

  return { trialExpired, loading: false };
};

export const isTrialAllowedRoute = (pathname: string): boolean => {
  return ALLOWED_ROUTES.some(route => pathname.startsWith(route));
};
