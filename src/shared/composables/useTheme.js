import { ref } from 'vue'

const storageKey = 'manzaspots_theme_preference'
const currentTheme = ref(localStorage.getItem(storageKey) || 'system')
let matchMediaInstance = null

export function useTheme() {
  const setTheme = (theme) => {
    currentTheme.value = theme
    localStorage.setItem(storageKey, theme)
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

  const initializeTheme = () => {
    if (window.matchMedia) {
      matchMediaInstance = window.matchMedia('(prefers-color-scheme: dark)')
      matchMediaInstance.addEventListener('change', handleSystemThemeChange)
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
