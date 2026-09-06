import { ref } from 'vue'
import { spotsApi } from '../api/spotsApi'
import { locationService } from '@/features/tracking/services/locationService'
import { mapSpotDetail, mapRoute } from '../utils/spotMapper'

export function useSpotDetail() {
  const spot = ref(null)
  const routes = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function getUserPos() {
    try {
      const pos = await locationService.getCurrentPosition()
      return { lat: pos.latitude, lng: pos.longitude }
    } catch {
      return null
    }
  }

  async function load(id) {
    loading.value = true
    error.value = null
    try {
      const userPos = await getUserPos()
      const raw = await spotsApi.getSpot(id)
      spot.value = mapSpotDetail(raw, userPos)
    } catch (err) {
      console.error('Error cargando el spot:', err)
      error.value = err
      spot.value = null
    } finally {
      loading.value = false
    }

    if (!spot.value) return

    try {
      const rawRoutes = await spotsApi.getSpotRoutes(id)
      routes.value = rawRoutes.map(mapRoute)
    } catch (err) {
      console.error('Error cargando las rutas del spot:', err)
      routes.value = []
    }
  }

  async function toggleFavorite() {
    if (!spot.value) return false

    const previous = spot.value.isFavorite
    spot.value.isFavorite = !previous

    try {
      if (previous) {
        await spotsApi.removeFavorite(spot.value.id)
      } else {
        await spotsApi.addFavorite(spot.value.id)
      }
      return true
    } catch (err) {
      spot.value.isFavorite = previous
      console.error('Error actualizando el favorito:', err)
      return false
    }
  }

  return { spot, routes, loading, error, load, toggleFavorite }
}
