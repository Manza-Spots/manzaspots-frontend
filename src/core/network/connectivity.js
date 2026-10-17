import { ref, readonly } from 'vue'
import { Network } from '@capacitor/network'
import { isNative } from '@/core/capacitor'

/**
 * Única fuente de verdad de "¿hay conexión?" para toda la app.
 *
 * En nativo manda el plugin Network (el sistema sabe si hay datos o Wi-Fi);
 * en web, los eventos online/offline del navegador. La API, la caché del mapa,
 * el aviso de la barra de navegación y la recarga al reconectar leen de aquí.
 */

const online = ref(typeof navigator === 'undefined' || navigator.onLine !== false)
const reconnectListeners = new Set()

function setOnline(value) {
  if (online.value === value) return
  online.value = value
  if (value) reconnectListeners.forEach((listener) => listener())
}

if (isNative) {
  Network.getStatus()
    .then((status) => setOnline(status.connected))
    .catch(() => {})
  Network.addListener('networkStatusChange', (status) => setOnline(status.connected))
} else if (typeof window !== 'undefined') {
  window.addEventListener('online', () => setOnline(true))
  window.addEventListener('offline', () => setOnline(false))
}

export const isOnline = readonly(online)

export const isOffline = () => !online.value

/**
 * Llama a `listener` cada vez que vuelve la conexión.
 * @returns {() => void} quita el listener.
 */
export function onReconnect(listener) {
  reconnectListeners.add(listener)
  return () => reconnectListeners.delete(listener)
}

/** Error de una petición que no llegó al servidor (sin red o sin respuesta). */
export const isNetworkError = (error) => error?.network === true
