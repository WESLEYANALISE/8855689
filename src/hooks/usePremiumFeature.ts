import { useSubscription } from '@/contexts/SubscriptionContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface UsePremiumFeatureOptions {
  featureName?: string;
  showToast?: boolean;
}

export const usePremiumFeature = (options: UsePremiumFeatureOptions = {}) => {
  const { isPremium, loading } = useSubscription();
  const navigate = useNavigate();
  
  const { featureName = 'recurso', showToast = true } = options;

  const checkPremiumAccess = (action?: () => void): boolean => {
    if (loading) return false;
    
    if (!isPremium) {
      if (showToast) {
        toast.error(`${featureName} é exclusivo para assinantes Premium`, {
          description: 'Assine agora e tenha acesso a todos os recursos!',
          action: {
            label: 'Ver planos',
            onClick: () => navigate('/assinatura')
          },
          duration: 5000
        });
      }
      return false;
    }
    
    if (action) {
      action();
    }
    return true;
  };

  const requirePremium = <T extends (...args: any[]) => any>(fn: T): T => {
    return ((...args: Parameters<T>) => {
      if (!isPremium) {
        if (showToast) {
          toast.error(`${featureName} é exclusivo para assinantes Premium`, {
            description: 'Assine agora e tenha acesso a todos os recursos!',
            action: {
              label: 'Ver planos',
              onClick: () => navigate('/assinatura')
            },
            duration: 5000
          });
        }
        return;
      }
      return fn(...args);
    }) as T;
  };

  return {
    isPremium,
    loading,
    checkPremiumAccess,
    requirePremium,
    navigateToSubscription: () => navigate('/assinatura')
  };
};
