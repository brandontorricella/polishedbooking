import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.4b68f67ff99e438ca615c52490432989',
  appName: 'Polished',
  webDir: 'dist',
  server: {
    url: 'https://4b68f67f-f99e-438c-a615-c52490432989.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#FFFDFB',
      showSpinner: false,
    },
  },
  ios: {
    contentInset: 'automatic',
    scheme: 'Polished',
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
