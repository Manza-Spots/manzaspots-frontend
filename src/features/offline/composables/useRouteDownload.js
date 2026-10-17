import { ref, watch } from 'vue'
import {
  downloadRoute,
  getOfflineRoute,
  deleteOfflineRoute,
} from '@/features/offline/services/offlineRoutes'

export const formatBytes = (bytes) => {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.max(Math.round(bytes / 1024), 1)} KB`
}

/**
 * Estado de la descarga sin señal de la ruta elegida.
 * @param {import('vue').Ref} spot   spot mapeado ({ id, name, location })
 * @param {import('vue').Ref} route  ruta mapeada (mapRoute) o null
 */
export function useRouteDownload(spot, route) {
  // idle: sin descargar · downloading · saved
  const status = ref('idle')
  const progress = ref({ done: 0, total: 0, bytes: 0 })
  const savedBytes = ref(0)
  let downloadingKey = null

  const keyOf = () => (spot.value && route.value ? `${spot.value.id}:${route.value.id}` : null)

  async function refresh() {
    const key = keyOf()
    status.value = key && key === downloadingKey ? 'downloading' : 'idle'
    if (!key || key === downloadingKey) return
    const saved = await getOfflineRoute(spot.value.id, route.value.id)
    if (keyOf() !== key) return
    if (saved) {
      status.value = 'saved'
      savedBytes.value = saved.bytes
    }
  }

  watch([spot, route], refresh, { immediate: true })

  async function download() {
    if (status.value === 'downloading' || !route.value) return false
    const key = keyOf()
    const r = route.value
    downloadingKey = key
    status.value = 'downloading'
    progress.value = { done: 0, total: 0, bytes: 0 }
    try {
      const record = await downloadRoute(
        spot.value,
        {
          id: r.id,
          description: r.description,
          path: r.path,
          travel_mode: r.travelMode,
          distance: r.distanceKm,
          difficulty_name: r.difficultyName,
          travel_mode_name: r.travelModeName,
        },
        (p) => {
          if (keyOf() === key) progress.value = p
        }
      )
      if (keyOf() === key) {
        status.value = 'saved'
        savedBytes.value = record.bytes
      }
      return true
    } catch (err) {
      console.warn('No se pudo descargar la ruta', err)
      if (keyOf() === key) status.value = 'idle'
      return false
    } finally {
      downloadingKey = null
    }
  }

  async function remove() {
    if (!route.value) return
    await deleteOfflineRoute(spot.value.id, route.value.id)
    status.value = 'idle'
  }

  return { status, progress, savedBytes, download, remove }
}
