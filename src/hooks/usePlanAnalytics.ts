import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type PlanActionType = "view_more" | "open_modal" | "select_pix" | "select_card" | "payment_initiated";
type PlanType = "mensal" | "vitalicio";

const detectDevice = (): string => {
  if (typeof window === 'undefined') return 'unknown';
  return /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
};

export const usePlanAnalytics = () => {
  const { user } = useAuth();

  const trackPlanClick = async (planType: PlanType, action: PlanActionType) => {
    try {
      const { error } = await supabase
        .from('plan_click_analytics')
        .insert({
          user_id: user?.id || null,
          plan_type: planType,
          action: action,
          device: detectDevice(),
        });

      if (error) {
        console.error('Erro ao registrar analytics:', error);
      }
    } catch (err) {
      console.error('Erro ao registrar analytics:', err);
    }
  };

  return { trackPlanClick };
};
