import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { hasPlanChosen } from '@/pages/EscolherPlano';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/contexts/SubscriptionContext';

interface ProfileData {
  id: string;
  nome: string | null;
  email: string | null;
  telefone: string | null;
  intencao: string | null;
  avatar_url: string | null;
}

interface OnboardingStatus {
  isComplete: boolean;
  planChosen: boolean;
  isLoading: boolean;
  profile: ProfileData | null;
  refetch: () => Promise<void>;
}

const ONBOARDING_COMPLETED_KEY = 'onboarding_completed';

export const useOnboardingStatus = (): OnboardingStatus => {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  const fetchProfile = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome, email, telefone, intencao, avatar_url')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar perfil:', error);
      }

      setProfile(data);
      
      // Se o perfil tem telefone e intenção, marcar como completo no localStorage
      if (data?.telefone && data?.intencao) {
        localStorage.setItem(`${ONBOARDING_COMPLETED_KEY}_${user.id}`, 'true');
      }
    } catch (err) {
      console.error('Erro ao verificar onboarding:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  // Verificar se já completou o onboarding antes (via localStorage)
  const hasCompletedBefore = user 
    ? localStorage.getItem(`${ONBOARDING_COMPLETED_KEY}_${user.id}`) === 'true'
    : false;

  // Verificar se já escolheu plano (localStorage OU já é Premium)
  const planChosen = user ? (hasPlanChosen(user.id) || isPremium) : false;

  // Onboarding é completo se:
  // 1. Já completou antes (localStorage) OU
  // 2. Telefone E intenção estão preenchidos
  const isComplete = hasCompletedBefore || Boolean(profile?.telefone && profile?.intencao);

  return {
    isComplete,
    planChosen,
    isLoading,
    profile,
    refetch: fetchProfile,
  };
};

// Função para marcar onboarding como completo (chamar após finalizar)
export const markOnboardingComplete = (userId: string) => {
  localStorage.setItem(`${ONBOARDING_COMPLETED_KEY}_${userId}`, 'true');
};
