import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.direitopremium',
  appName: 'Direito Premium',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1f1f1f',
      showSpinner: false
    },
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#1f1f1f'
    }
  }
};

export default config;
