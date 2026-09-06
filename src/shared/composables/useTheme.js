import { ref } from 'vue'
import { Preferences } from '@capacitor/preferences'

const storageKey = 'manzaspots_theme_preference'
const currentTheme = ref(localStorage.getItem(storageKey) || 'system')
let matchMediaInstance = null

function resolveIsDark(theme, systemIsDark = null) {
  if (theme === 'dark') return true
  if (theme === 'light') return false
  if (systemIsDark !== null) return systemIsDark
  return !!window.matchMedia?.('(prefers-color-scheme: dark)').matches
}

function applyTheme(theme, systemIsDark = null) {
  document.documentElement.classList.toggle('dark', resolveIsDark(theme, systemIsDark))
}

// Se aplica al importar, antes de montar la app. `localStorage` es síncrono, así
// que aquí ya se sabe el tema. Si la clase llegara después —como pasaba al
// esperar a `Preferences`— los mapas se construirían con el estilo contrario y
// lo recargarían entero con `setStyle`: sprites, glifos y teselas de nuevo.
applyTheme(currentTheme.value)

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


  const initializeTheme = async () => {
    if (window.matchMedia) {
      matchMediaInstance = window.matchMedia('(prefers-color-scheme: dark)')
      matchMediaInstance.addEventListener('change', handleSystemThemeChange)
    }

    // Cargar preferencia nativa en dispositivos iOS/Android si existe
    try {
      const { value } = await Preferences.get({ key: storageKey })
      // Solo se reaplica si difiere: repetirlo mutaría la clase y haría que los
      // mapas recargasen su estilo sin que el tema haya cambiado.
      if (value && value !== currentTheme.value) {
        currentTheme.value = value
        localStorage.setItem(storageKey, value) // Sincronizar el fallback
        applyTheme(value)
      }
    } catch {
      // Sin Preferences (web sin soporte completo) conservamos el localStorage.
    }
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
