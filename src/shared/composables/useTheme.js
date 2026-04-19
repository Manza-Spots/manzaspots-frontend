import { ref } from 'vue'
import { Preferences } from '@capacitor/preferences'

const storageKey = 'manzaspots_theme_preference'
const currentTheme = ref(localStorage.getItem(storageKey) || 'system')
let matchMediaInstance = null

export function useTheme() {
  const setTheme = async (theme) => {
    currentTheme.value = theme
    localStorage.setItem(storageKey, theme) // Web fallback
    try {
      await Preferences.set({ key: storageKey, value: theme })
    } catch (error) {
      console.warn('Preferences API falló, usando solo localStorage', error)
    }
    applyTheme(theme)
  }

  const handleSystemThemeChange = (e) => {
    if (currentTheme.value === 'system') {
      applyTheme('system', e.matches)
    }
  }

  const applyTheme = (theme, systemIsDark = null) => {
    let isDark = false

    if (theme === 'dark') {
      isDark = true
    } else if (theme === 'light') {
      isDark = false
    } else if (theme === 'system') {
      if (systemIsDark !== null) {
        isDark = systemIsDark
      } else if (window.matchMedia) {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      }
    }

    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const initializeTheme = async () => {
    if (window.matchMedia) {
      matchMediaInstance = window.matchMedia('(prefers-color-scheme: dark)')
      matchMediaInstance.addEventListener('change', handleSystemThemeChange)
    }

    // Cargar preferencia nativa en dispositivos iOS/Android si existe
    try {
      const { value } = await Preferences.get({ key: storageKey })
      if (value) {
        currentTheme.value = value
        localStorage.setItem(storageKey, value) // Sincronizar el fallback
      }
    } catch (e) {
      // Usar silencio; si falla (e.g. entorno web sin soporte completo) conservamos el localStorage original
    }

    applyTheme(currentTheme.value)
  }

  const cleanupTheme = () => {
    if (matchMediaInstance) {
      matchMediaInstance.removeEventListener('change', handleSystemThemeChange)
    }
  }

  return {
    currentTheme,
    setTheme,
    initializeTheme,
    cleanupTheme
  }
}
