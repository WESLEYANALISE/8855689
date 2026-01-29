import { Browser } from '@capacitor/browser';
import { useCapacitorPlatform } from './use-capacitor-platform';

export function useExternalBrowser() {
  const { isNative } = useCapacitorPlatform();

  const openUrl = async (url: string) => {
    if (isNative) {
      // Abre no navegador externo (Safari/Chrome)
      await Browser.open({ 
        url,
        presentationStyle: 'fullscreen'
      });
    } else {
      // Web: abre em nova aba
      window.open(url, '_blank');
    }
  };

  const close = async () => {
    if (isNative) {
      await Browser.close();
    }
  };

  return { openUrl, close, isNative };
}
