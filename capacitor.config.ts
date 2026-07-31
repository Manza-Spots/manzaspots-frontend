import { CapacitorConfig } from '@capacitor/cli'

// El dev server (hot reload sobre el dispositivo) solo se usa cuando CAP_ENV=dev.
// En producción se omite `server.url` para que la app cargue desde `dist/` (webDir).
const isDev = process.env.CAP_ENV === 'dev'

const config: CapacitorConfig = {
  appId: 'com.manzaspots.hiking',
  appName: 'Manzaspots',
  webDir: 'dist',
  server: isDev
    ? {
        url: 'http://192.168.1.75:5173', // para debugueo local
        cleartext: true,
        androidScheme: 'https',
        // Permitir navegación a tu API
        allowNavigation: ['http://192.168.1.75:5173', 'http://localhost:8000'],
      }
    : {
        androidScheme: 'https',
      },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      launchFadeOutDuration: 0,
      backgroundColor: '#050c16ff',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#364153ff',
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
    appendUserAgent:"Mozilla/5.0 (Linux; Android 10; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.162 Mobile Safari/537.36"
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#000000',
    scrollEnabled: true,
    webContentsDebuggingEnabled: true,
    appendUserAgent:"Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
  },
}

export default config
