import { Capacitor } from '@capacitor/core';

export type Platform = 'web' | 'ios' | 'android';

interface CapacitorPlatformInfo {
  platform: Platform;
  isNative: boolean;
  isWeb: boolean;
  isIOS: boolean;
  isAndroid: boolean;
}

export function useCapacitorPlatform(): CapacitorPlatformInfo {
  const platform = Capacitor.getPlatform() as Platform;
  const isNative = Capacitor.isNativePlatform();
  
  return {
    platform,
    isNative,
    isWeb: platform === 'web',
    isIOS: platform === 'ios',
    isAndroid: platform === 'android'
  };
}
