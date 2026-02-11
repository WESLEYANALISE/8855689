import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Declare fbq on window
declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
  }
}

type FacebookEventName =
  | 'PageView'
  | 'CompleteRegistration'
  | 'ViewContent'
  | 'AddToCart'
  | 'InitiateCheckout'
  | 'Purchase'
  | 'Lead';

interface CustomData {
  content_name?: string;
  content_category?: string;
  content_type?: string;
  currency?: string;
  value?: number;
  status?: boolean;
  payment_method?: string;
  [key: string]: any;
}

const generateEventId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const useFacebookPixel = () => {
  const { user } = useAuth();

  const trackEvent = useCallback(
    (eventName: FacebookEventName, customData?: CustomData, testEventCode?: string) => {
      const eventId = generateEventId();

      // 1. Frontend Pixel
      try {
        if (typeof window !== 'undefined' && window.fbq) {
          window.fbq('track', eventName, customData || {}, { eventID: eventId });
        }
      } catch (e) {
        console.warn('Facebook Pixel error:', e);
      }

      // 2. Server-side Conversions API
      const userData: Record<string, string> = {};
      if (user?.email) {
        userData.em = user.email;
      }

      supabase.functions
        .invoke('facebook-conversions', {
          body: {
            event_name: eventName,
            event_id: eventId,
            event_time: Math.floor(Date.now() / 1000),
            event_source_url: window.location.href,
            action_source: 'website',
            user_data: {
              ...userData,
              client_user_agent: navigator.userAgent,
            },
            custom_data: customData || undefined,
            ...(testEventCode && { test_event_code: testEventCode }),
          },
        })
        .catch((err) => console.warn('Facebook CAPI error:', err));
    },
    [user]
  );

  return { trackEvent };
};
