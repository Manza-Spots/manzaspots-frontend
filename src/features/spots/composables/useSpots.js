import { ref } from 'vue'
import { spotsApi } from '../api/spotsApi'
import { locationService } from '@/features/tracking/services/locationService'
import { haversineMeters } from '@/features/tracking/utils/geo'

/** Extrae { lng, lat } de un GeoJSON Point. */
function pointToLngLat(location) {
  const coords = location?.coordinates
  if (!Array.isArray(coords) || coords.length < 2) return null
  return { lng: coords[0], lat: coords[1] }
}

/**
 * Resuelve la URL de imagen del backend. Si viene relativa (`/media/...`),
 * la prefija con el origin de VITE_API_URL.
 */
function resolveMediaUrl(path) {
  if (!path) return ''
  if (/^https?:\/\//.test(path)) return path
  try {
    const origin = new URL(import.meta.env.VITE_API_URL).origin
    return origin + (path.startsWith('/') ? path : `/${path}`)
  } catch {
    return path
  }
}

/**
 * Mapea un spot del backend a la forma que consumen las tarjetas/lista.
 * Calcula la distancia (km) desde la posición del usuario si está disponible.
 */
function mapSpot(spot, userPos) {
  const point = pointToLngLat(spot.location)
  let distanceKm = null
  if (userPos && point) {
    distanceKm = haversineMeters(userPos, point) / 1000
  }
  return {
    id: spot.id,
    name: spot.name,
    description: spot.description,
    imageUrl: resolveMediaUrl(spot.spot_thumbnail_path),
    // El backend no maneja categorías; la UI oculta el badge cuando es null.
    category: null,
    location: point,
    distanceKm,
    distance: distanceKm != null ? `${distanceKm.toFixed(1)} km` : '',
    isFavorite: spot.is_favorite ?? false,
  }
}

/**
 * Carga y expone la lista real de spots desde la API, con distancia calculada
 * en cliente y ordenada por cercanía cuando hay ubicación del usuario.
 */
export function useSpots() {
  const spots = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function load() {
    loading.value = true
    error.value = null
    try {
      // Ubicación del usuario (opcional) para calcular/ordenar por distancia.
      let userPos = null
      try {
        const pos = await locationService.getCurrentPosition()
        userPos = { lat: pos.latitude, lng: pos.longitude }
      } catch {
        // Sin ubicación: se listan sin distancia.
      }

      const raw = await spotsApi.getSpots()
      let mapped = raw.map((s) => mapSpot(s, userPos))

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

  return { spots, loading, error, load }
}
