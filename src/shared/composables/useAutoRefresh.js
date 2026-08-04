import { onMounted, onUnmounted } from 'vue'
import { App } from '@capacitor/app'
import { isNative } from '@/core/capacitor'
import { triggerRefresh } from './useRefreshable'

// Volver en unos segundos no justifica recargar; volver tras un rato sí.
const STALE_AFTER_MS = 2 * 60 * 1000

/**
 * Recarga la vista activa cuando los datos pueden haber quedado viejos:
 * al volver la app del segundo plano y al recuperar la conexión.
 *
 * Se llama una sola vez, desde App.vue. Qué se recarga lo decide cada
 * vista a través de useRefreshable.
 *
 * Escucha `online` directamente en vez de reutilizar usePWA: ese composable
 * llama a useRegisterSW en cada invocación y registraría el service worker
 * por segunda vez.
 */
export function useAutoRefresh() {
  let backgroundedAt = null
  let appListener = null

  const onReconnect = () => triggerRefresh()

  onMounted(() => {
    window.addEventListener('online', onReconnect)

    if (isNative) {
      App.addListener('appStateChange', ({ isActive }) => {
        if (!isActive) {
          backgroundedAt = Date.now()
          return
        }

        if (backgroundedAt && Date.now() - backgroundedAt >= STALE_AFTER_MS) {
          triggerRefresh()
        }
        backgroundedAt = null
      }).then((handle) => {
        appListener = handle
      })
    }
  })

  onUnmounted(() => {
    window.removeEventListener('online', onReconnect)
    appListener?.remove()
    appListener = null
  })
}
