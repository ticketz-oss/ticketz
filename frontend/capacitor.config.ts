import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ticketzneo.app',
  appName: 'Ticketz Neo',
  webDir: 'dist',
  android: {
    allowMixedContent: true,
  },
  server: {
    cleartext: true,
    androidScheme: 'https',
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
