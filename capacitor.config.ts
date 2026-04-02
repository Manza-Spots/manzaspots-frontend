import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.manzaspots.hiking',
  appName: 'Manzaspots',
  webDir: 'dist',
  server: {
    url: 'http://192.168.3.160:5173', // para debugueo local
    cleartext: true,
    androidScheme: 'https',
    // Permitir navegación a tu API
    allowNavigation: ['http://192.168.3.160:8000', 'http://localhost:8000'],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: false,
      launchFadeOutDuration: 300,
      backgroundColor: '#10b981',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: false,
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#488AFF',
    },
    StatusBar: {
    },
    Keyboard: {
      resize: 'none',
      resizeOnFullScreen: false,
    },
    Geolocation: {},
  },
  android: {
    allowMixedContent: true,
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#000000',
    scrollEnabled: true,
    webContentsDebuggingEnabled: true,
  },
}

export default config
