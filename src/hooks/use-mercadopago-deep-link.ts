import { Browser } from '@capacitor/browser';
import { useCapacitorPlatform } from './use-capacitor-platform';
import { App } from '@capacitor/app';

/**
 * Hook para abrir checkout do Mercado Pago
 * Tenta abrir no app do MP primeiro, com fallback para navegador externo
 */
export function useMercadoPagoDeepLink() {
  const { isNative, platform } = useCapacitorPlatform();

  /**
   * Converte URL de checkout para deep link do app Mercado Pago
   * Formato: mercadopago://checkout?url=ENCODED_URL
   */
  const getDeepLinkUrl = (checkoutUrl: string): string => {
    // O app do Mercado Pago aceita deep links no formato:
    // mercadopago://checkout/v1/redirect?pref_id=XXX
    // ou simplesmente tenta abrir a URL diretamente
    
    // Extrair o preference_id ou preapproval_id da URL se disponível
    const url = new URL(checkoutUrl);
    
    // Para URLs do Mercado Pago, o deep link é:
    // Android: com.mercadopago.android
    // iOS: mercadopago://
    
    // Formato universal que funciona em ambos
    return `mercadopago://open?url=${encodeURIComponent(checkoutUrl)}`;
  };

  /**
   * Abre o checkout do Mercado Pago
   * 1. Tenta abrir no app do MP via deep link
   * 2. Se falhar após timeout, abre no navegador externo
   */
  const openCheckout = async (checkoutUrl: string): Promise<void> => {
    if (!isNative) {
      // Web: abre em nova aba
      window.open(checkoutUrl, '_blank');
      return;
    }

    const deepLinkUrl = getDeepLinkUrl(checkoutUrl);
    
    console.log('[MP DeepLink] Tentando abrir app do Mercado Pago...');
    console.log('[MP DeepLink] Deep link URL:', deepLinkUrl);

    try {
      // Tenta abrir o deep link do app
      // Se o app não estiver instalado, vai falhar ou não fazer nada
      
      // Usamos um timeout curto para detectar se o app abriu
      const appOpened = await tryOpenApp(deepLinkUrl);
      
      if (!appOpened) {
        console.log('[MP DeepLink] App não encontrado, abrindo navegador externo...');
        await openInBrowser(checkoutUrl);
      }
    } catch (error) {
      console.error('[MP DeepLink] Erro ao tentar deep link:', error);
      // Fallback para navegador externo
      await openInBrowser(checkoutUrl);
    }
  };

  /**
   * Tenta abrir o app via deep link
   * Retorna true se o app foi aberto, false caso contrário
   */
  const tryOpenApp = async (deepLinkUrl: string): Promise<boolean> => {
    return new Promise((resolve) => {
      let resolved = false;
      
      // Listener para detectar quando o app volta ao foco
      // Se voltar muito rápido, significa que o app do MP não abriu
      const handleResume = () => {
        if (!resolved) {
          // App voltou ao foco rapidamente = app do MP não instalado
          console.log('[MP DeepLink] App voltou ao foco - MP provavelmente não instalado');
          resolved = true;
          resolve(false);
        }
      };

      // Configura listener de resume
      App.addListener('appStateChange', ({ isActive }) => {
        if (isActive && !resolved) {
          // Se voltar em menos de 1.5s, provavelmente o app não abriu
          handleResume();
        }
      });

      // Tenta abrir o deep link usando window.location
      // Isso funciona melhor para deep links de apps externos
      window.location.href = deepLinkUrl;

      // Timeout de fallback
      // Se após 2 segundos nada aconteceu, considera que o app abriu
      // (o usuário está no app do MP e vai voltar depois)
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          // Remove listener
          App.removeAllListeners();
          // Assume que o app abriu (usuário está no MP)
          console.log('[MP DeepLink] Timeout - assumindo que app abriu');
          resolve(true);
        }
      }, 2000);
    });
  };

  /**
   * Abre URL no navegador externo
   */
  const openInBrowser = async (url: string): Promise<void> => {
    await Browser.open({ 
      url,
      presentationStyle: 'fullscreen'
    });
  };

  return { openCheckout, isNative };
}
