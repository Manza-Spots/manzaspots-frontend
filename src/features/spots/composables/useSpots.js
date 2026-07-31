import { ref } from 'vue'
import { spotsApi } from '../api/spotsApi'
import { locationService } from '@/features/tracking/services/locationService'
import { mapSpot } from '../utils/spotMapper'

/**
 * Carga y expone la lista real de spots desde la API, con distancia calculada
 * en cliente y ordenada por cercanía cuando hay ubicación del usuario.
 */
export function useSpots() {
  const spots = ref([])
  const loading = ref(false)
  const error = ref(null)

  // La ubicación del usuario se resuelve una sola vez y se reutiliza entre cargas
  // (evita re-pedir el GPS en cada cambio de viewport del mapa).
  let userPos = null
  let userPosResolved = false

  async function ensureUserPos() {
    if (userPosResolved) return userPos
    userPosResolved = true
    try {
      const pos = await locationService.getCurrentPosition()
      userPos = { lat: pos.latitude, lng: pos.longitude }
    } catch {
      userPos = null // Sin ubicación: se listan sin distancia.
    }
    return userPos
  }

  /**
   * Carga spots desde la API. `params` se pasa como query string
   * (p. ej. bounding box, name, radio…).
   */
  async function load(params = {}) {
    loading.value = true
    error.value = null
    try {
      await ensureUserPos()

      const raw = await spotsApi.getSpots(params)
      const mapped = raw.map((s) => mapSpot(s, userPos))

      if (userPos) {
        mapped.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
      }

      spots.value = mapped
    } catch (err) {
      console.error('Error cargando spots:', err)
      error.value = err
    } finally {
      loading.value = false
    }
  }

  return { spots, loading, error, load, ensureUserPos }
}
