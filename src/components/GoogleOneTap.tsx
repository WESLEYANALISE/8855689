import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const GOOGLE_CLIENT_ID = '581104058324-nh357j8viq3i1cje3eahjrq8llj5rf0i.apps.googleusercontent.com';

interface GoogleOneTapProps {
  onLoadingChange?: (loading: boolean) => void;
  disabled?: boolean;
}

interface GoogleCredentialResponse {
  credential: string;
  select_by: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            nonce?: string;
            use_fedcm_for_prompt?: boolean;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: (notification?: (notification: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void) => void;
          renderButton: (element: HTMLElement, config: {
            theme?: 'outline' | 'filled_blue' | 'filled_black';
            size?: 'large' | 'medium' | 'small';
            text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
            shape?: 'rectangular' | 'pill' | 'circle' | 'square';
            logo_alignment?: 'left' | 'center';
            width?: number;
            locale?: string;
          }) => void;
          cancel: () => void;
        };
      };
    };
  }
}

const generateNonce = async (): Promise<[string, string]> => {
  const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
  const encoder = new TextEncoder();
  const encodedNonce = encoder.encode(nonce);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encodedNonce);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashedNonce = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return [nonce, hashedNonce];
};

export const GoogleOneTap = ({ onLoadingChange, disabled }: GoogleOneTapProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const buttonRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const nonceRef = useRef<string>('');

  const handleCredentialResponse = useCallback(async (response: GoogleCredentialResponse) => {
    onLoadingChange?.(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
        nonce: nonceRef.current,
      });

      if (error) {
        console.error('Google sign in error:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível fazer login com o Google. Tente novamente.',
          variant: 'destructive',
        });
        return;
      }

      if (data.user) {
        // Login silencioso - sem toast de boas-vindas
        navigate('/', { replace: true });
      }
    } catch (err) {
      console.error('Google auth error:', err);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro inesperado. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      onLoadingChange?.(false);
    }
  }, [navigate, toast, onLoadingChange]);

  useEffect(() => {
    if (disabled || initializedRef.current) return;

    const initializeGoogleOneTap = async () => {
      // Generate nonce
      const [nonce, hashedNonce] = await generateNonce();
      nonceRef.current = nonce;

      // Load Google Identity Services script
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        if (!window.google) return;

        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          nonce: hashedNonce,
          use_fedcm_for_prompt: true,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        // Render the button with a small delay to ensure element has width
        if (buttonRef.current) {
          setTimeout(() => {
            if (buttonRef.current && window.google) {
              const buttonWidth = buttonRef.current.offsetWidth || 300;
              window.google.accounts.id.renderButton(buttonRef.current, {
                theme: 'outline',
                size: 'large',
                text: 'continue_with',
                shape: 'rectangular',
                logo_alignment: 'left',
                width: Math.max(buttonWidth, 200),
                locale: 'pt-BR',
              });
            }
          }, 100);
        }

        // Show the One Tap prompt
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            console.log('One Tap not displayed, using button fallback');
          }
        });

        initializedRef.current = true;
      };

      document.body.appendChild(script);

      return () => {
        // Cleanup
        const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
        if (existingScript) {
          existingScript.remove();
        }
        if (window.google?.accounts?.id) {
          window.google.accounts.id.cancel();
        }
      };
    };

    initializeGoogleOneTap();
  }, [disabled, handleCredentialResponse]);

  if (disabled) return null;

  return (
    <div className="w-full">
      <div ref={buttonRef} className="w-full flex justify-center" />
    </div>
  );
};

export const triggerGoogleOneTap = () => {
  if (window.google?.accounts?.id) {
    window.google.accounts.id.prompt();
  }
};

export default GoogleOneTap;
