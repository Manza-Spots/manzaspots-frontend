import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { StatusBar, Style } from '@capacitor/status-bar'
import { SplashScreen } from '@capacitor/splash-screen'
import { Network } from '@capacitor/network'
import { disableDoubleTapZoom } from './disableZoom'

export const isNative = Capacitor.isNativePlatform()
export const platform = Capacitor.getPlatform() // 'ios' | 'android' | 'web'

// Configuración de colores para Status Bar
export const statusBarConfig = {
  light: {
    style: Style.Dark,
    backgroundColor: '#ffffff',
  },
  dark: {
    style: Style.Light,
    backgroundColor: '#111827',
  },
}

export function isDarkMode() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
}

export async function applyStatusBarTheme() {
  if (!isNative) return

  const darkMode = isDarkMode()
  const config = darkMode ? statusBarConfig.dark : statusBarConfig.light

  try {
    await StatusBar.setStyle({ style: config.style })

    if (platform === 'android') {
      await StatusBar.setBackgroundColor({ color: config.backgroundColor })
    }
  } catch (error) {
    console.error('Error applying status bar theme:', error)
  }
}

export async function setStatusBarStyle(theme = 'light') {
  if (!isNative) return

  try {
    const config = statusBarConfig[theme] || statusBarConfig.light

    await StatusBar.setStyle({ style: config.style })

    // Solo en Android configurar backgroundColor
    if (platform === 'android') {
      await StatusBar.setBackgroundColor({ color: config.backgroundColor })
    }

    await StatusBar.show()
  } catch (error) {
    console.error('Error setting status bar style:', error)
  }
}

export async function hideStatusBar() {
  if (!isNative) return

  try {
    await StatusBar.hide()
  } catch (error) {
    console.error('Error hiding status bar:', error)
  }
}

export async function showStatusBar() {
  if (!isNative) return

  try {
    await StatusBar.show()
  } catch (error) {
    console.error('Error showing status bar:', error)
  }
}

// Inicialización de Capacitor
export async function initializeCapacitor() {
  if (!isNative) return

  try {
    // Configurar Status Bar
    if (platform === 'ios') {
      // En iOS: NO usar overlay, dejar que iOS maneje el espacio
      await StatusBar.setOverlaysWebView({ overlay: false })

      // FORZAR estilo Light (texto blanco) independientemente del tema del sistema
      await StatusBar.setStyle({ style: Style.Light })

      // Forzar fondo si es necesario (aunque con overlay:false no debería ser necesario)
      await StatusBar.setBackgroundColor({ color: '#ffffff' })
    } else if (platform === 'android') {
      // En Android: configuración normal
      await setStatusBarStyle('light')
    }

    // ... resto del código igual
  } catch (error) {
    console.error('Error initializing Capacitor:', error)
  }
}

export async function checkPermissions(plugin, permission) {
  try {
    const result = await plugin.checkPermissions()
    return result[permission] === 'granted'
  } catch (error) {
    console.error('Error checking permissions:', error)
    return false
  }
}

export async function requestPermissions(plugin) {
  try {
    const result = await plugin.requestPermissions()
    return result
  } catch (error) {
    console.error('Error requesting permissions:', error)
    return null
  }
}
