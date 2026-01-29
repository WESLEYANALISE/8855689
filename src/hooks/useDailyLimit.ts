import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/contexts/AuthContext';

// Configuração centralizada de limites diários
const DAILY_LIMITS: Record<string, { free: number; premium: number }> = {
  'resumos-personalizados': { free: 3, premium: 99999 },
  'chat-professora': { free: 10, premium: 99999 },
  'mapa-mental-gerar': { free: 2, premium: 99999 },
  'simulacao-audiencia': { free: 2, premium: 99999 },
  'flashcards-gerar': { free: 3, premium: 99999 },
  'questoes-gerar': { free: 3, premium: 99999 },
  'explicar-artigo': { free: 5, premium: 99999 },
  'plano-estudos': { free: 1, premium: 99999 },
};

// Chave do localStorage com data para reset automático
const getStorageKey = (feature: string) => `daily_limit_${feature}`;

interface StoredUsage {
  date: string;
  count: number;
}

const getTodayDateString = () => new Date().toISOString().split('T')[0];

export interface DailyLimitResult {
  canUse: boolean;
  usedToday: number;
  limitToday: number;
  remainingUses: number;
  isUnlimited: boolean;
  incrementUse: () => void;
  loading: boolean;
}

export function useDailyLimit(feature: string): DailyLimitResult {
  const { isPremium, loading: subscriptionLoading } = useSubscription();
  const { user } = useAuth();
  const [usedToday, setUsedToday] = useState(0);
  const [loading, setLoading] = useState(true);

  // Obter limite baseado no status premium
  const limitConfig = DAILY_LIMITS[feature] || { free: 5, premium: 99999 };
  const limitToday = isPremium ? limitConfig.premium : limitConfig.free;
  const isUnlimited = limitToday >= 99999;

  // Carregar uso do localStorage
  useEffect(() => {
    const loadUsage = () => {
      const storageKey = getStorageKey(feature);
      const today = getTodayDateString();
      
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed: StoredUsage = JSON.parse(stored);
          // Se a data é diferente de hoje, resetar
          if (parsed.date === today) {
            setUsedToday(parsed.count);
          } else {
            // Data diferente = novo dia, resetar contador
            localStorage.setItem(storageKey, JSON.stringify({ date: today, count: 0 }));
            setUsedToday(0);
          }
        } else {
          localStorage.setItem(storageKey, JSON.stringify({ date: today, count: 0 }));
          setUsedToday(0);
        }
      } catch (e) {
        console.error('Erro ao carregar limite diário:', e);
        setUsedToday(0);
      }
      
      setLoading(false);
    };

    if (!subscriptionLoading) {
      loadUsage();
    }
  }, [feature, subscriptionLoading]);

  // Função para incrementar uso
  const incrementUse = useCallback(() => {
    const storageKey = getStorageKey(feature);
    const today = getTodayDateString();
    
    setUsedToday(prev => {
      const newCount = prev + 1;
      localStorage.setItem(storageKey, JSON.stringify({ date: today, count: newCount }));
      return newCount;
    });
  }, [feature]);

  // Calcular valores derivados
  const remainingUses = useMemo(() => {
    if (isUnlimited) return 99999;
    return Math.max(0, limitToday - usedToday);
  }, [limitToday, usedToday, isUnlimited]);

  const canUse = useMemo(() => {
    if (isUnlimited) return true;
    return usedToday < limitToday;
  }, [usedToday, limitToday, isUnlimited]);

  return {
    canUse,
    usedToday,
    limitToday,
    remainingUses,
    isUnlimited,
    incrementUse,
    loading: loading || subscriptionLoading,
  };
}

// Hook para obter informações de limite sem incrementar (para exibição)
export function useDailyLimitInfo(feature: string) {
  const result = useDailyLimit(feature);
  return {
    usedToday: result.usedToday,
    limitToday: result.limitToday,
    remainingUses: result.remainingUses,
    isUnlimited: result.isUnlimited,
    loading: result.loading,
  };
}

// Exportar configuração de limites para referência
export const FEATURE_LIMITS = DAILY_LIMITS;
