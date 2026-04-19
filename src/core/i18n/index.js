import { createI18n } from 'vue-i18n'

import es from './locales/es'
import en from './locales/en'

/** Idiomas soportados por la app */
const SUPPORTED_LOCALES = ['en', 'es']

/** Idioma de fallback cuando no hay coincidencia */
const FALLBACK_LOCALE = 'en'

/**
 * Detecta el idioma del sistema operativo del dispositivo.
 * Funciona tanto en web como en nativo (Android/iOS via Capacitor),
 * ya que el webview expone navigator.language con el locale del SO.
 *
 * Ejemplos de valores que puede devolver navigator.language:
 *   'es-MX' → 'es'
 *   'en-US' → 'en'
 *   'fr-FR' → (no soportado) → FALLBACK_LOCALE
 */
function detectSystemLocale() {
  const rawLocale = navigator.language || navigator.userLanguage || FALLBACK_LOCALE

  // Tomamos solo la parte del idioma base (ej. 'es' de 'es-MX')
  const baseLocale = rawLocale.split('-')[0].toLowerCase()

  return SUPPORTED_LOCALES.includes(baseLocale) ? baseLocale : FALLBACK_LOCALE
}

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: detectSystemLocale(),
  fallbackLocale: FALLBACK_LOCALE,
  messages: {
    en,
    es
  }
})

export default i18n