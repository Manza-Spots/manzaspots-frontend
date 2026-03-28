import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'

export const isNative = Capacitor.isNativePlatform()
export const platform = Capacitor.getPlatform()


export const statusBarConfig = {
  light: {
    style: Style.Dark,
  },
  dark: {
    style: Style.Light,
  },
}

export function isDarkMode() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
}

export async function setStatusBarStyle(theme = 'light') {
  if (!isNative) return

  try {
    const config = statusBarConfig[theme] || statusBarConfig.light

    await StatusBar.setStyle({ style: config.style })

    await StatusBar.show()
  } catch (error) {
    console.error('Error setting status bar style:', error)
  }
}

export async function initializeCapacitor() {
  if (!isNative) return

  try {
    if (platform === 'ios') {
      await StatusBar.setOverlaysWebView({ overlay: true })

    } else if (platform === 'android') {
        await StatusBar.setOverlaysWebView({ overlay: true })
        await StatusBar.setBackgroundColor({ color: '#00000000' })
        window.matchMedia('(prefers-color-scheme: dark)')
            .addEventListener('change', async () => {
                await StatusBar.setBackgroundColor({ color: '#00000000' })
            })
    }
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
