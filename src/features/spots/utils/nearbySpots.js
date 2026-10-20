import { spotsApi } from '@/features/spots/api/spotsApi'
import { profileApi } from '@/features/profile/api/profileApi'
import { mapSpot, pointToLngLat } from '@/features/spots/utils/spotMapper'
import { haversineMeters } from '@/features/tracking/utils/geo'

// Dos spots a menos de esto son el mismo lugar: al guardar una ruta o proponer
// un spot se ofrecen los existentes en vez de crear uno nuevo.
export const NEARBY_SPOT_RADIUS_M = 300

/**
 * Spots a menos de `radiusM` de un punto, ordenados por distancia: los
 * publicados y los propios que siguen en revisión (la API no da los pendientes
 * de otros usuarios). Cada spot mapeado lleva `isPending`.
 *
 * @param {{ lat: number, lng: number }} point
 * @param {{ radiusM?: number, includeOwn?: boolean }} [options]
 */
export async function findNearbySpots(point, { radiusM = NEARBY_SPOT_RADIUS_M, includeOwn = true } = {}) {
  const [approved, own] = await Promise.all([
    spotsApi.getSpots({ lat: point.lat, lng: point.lng, radius: radiusM / 1000 }),
    includeOwn ? profileApi.getMySpots().catch(() => []) : [],
  ])

  const ids = new Set(approved.map((spot) => spot.id))
  // Los rechazados traen motivo; los aprobados ya vienen en la búsqueda.
  const pending = own.filter((spot) => {
    if (ids.has(spot.id) || spot.reject_reason) return false
    const location = pointToLngLat(spot.location)
    return location && haversineMeters(point, location) <= radiusM
  })

  return [
    ...approved.map((spot) => ({ ...mapSpot(spot, point), isPending: false })),
    ...pending.map((spot) => ({ ...mapSpot(spot, point), isPending: true })),
  ]
    .map((spot) => ({ ...spot, distance: formatMeters(spot.distanceKm) }))
    .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
}

// A esta escala los km con un decimal no dicen nada ("0.1 km"): se muestran metros.
function formatMeters(distanceKm) {
  if (distanceKm == null) return ''
  return `${Math.round((distanceKm * 1000) / 10) * 10} m`
}
