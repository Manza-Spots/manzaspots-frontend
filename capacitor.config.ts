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
      launchShowDuration: 1000,
      backgroundColor: '#ffffff',
      showSpinner: false,
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#488AFF',
    },
    StatusBar: {
      style: 'light',
      backgroundColor: '#000000',
      overlaysWebView: false,
    },
    Geolocation: {
      // Configuración específica para tracking continuo
    },
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#10b981',
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#000000',
    // Habilitar WebView inspector en desarrollo
    webContentsDebuggingEnabled: true,
  },
}

export default config
