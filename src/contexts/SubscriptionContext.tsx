import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionData {
  id: string;
  status: string;
  planType: string;
  amount: number;
  expirationDate: string | null;
  paymentMethod: string | null;
  createdAt: string;
}

interface SubscriptionContextType {
  isPremium: boolean;
  subscription: SubscriptionData | null;
  daysRemaining: number | null;
  loading: boolean;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  isPremium: false,
  subscription: null,
  daysRemaining: null,
  loading: true,
  refreshSubscription: async () => {},
});

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSubscription = useCallback(async () => {
    if (!user?.id) {
      setIsPremium(false);
      setSubscription(null);
      setDaysRemaining(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('mercadopago-verificar-assinatura', {
        body: { userId: user.id }
      });

      if (error) {
        console.error('Erro ao verificar assinatura:', error);
        setIsPremium(false);
        setSubscription(null);
        setDaysRemaining(null);
      } else {
        setIsPremium(data?.isPremium || false);
        setSubscription(data?.subscription || null);
        setDaysRemaining(data?.daysRemaining || null);
      }
    } catch (error) {
      console.error('Erro ao verificar assinatura:', error);
      setIsPremium(false);
      setSubscription(null);
      setDaysRemaining(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  const refreshSubscription = useCallback(async () => {
    setLoading(true);
    await checkSubscription();
  }, [checkSubscription]);

  return (
    <SubscriptionContext.Provider value={{ isPremium, subscription, daysRemaining, loading, refreshSubscription }}>
      {children}
    </SubscriptionContext.Provider>
  );
};
