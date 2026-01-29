import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { useCapacitorPlatform } from './use-capacitor-platform';

export function useAppLifecycle(onResume?: () => void) {
  const { isNative } = useCapacitorPlatform();

  useEffect(() => {
    if (!isNative || !onResume) return;

    const listener = App.addListener('appStateChange', (state) => {
      if (state.isActive) {
        onResume();
      }
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, [isNative, onResume]);
}
