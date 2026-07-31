import { haversineMeters } from '@/features/tracking/utils/geo'

/** Extrae { lng, lat } de un GeoJSON Point. */
export function pointToLngLat(location) {
  const coords = location?.coordinates
  if (!Array.isArray(coords) || coords.length < 2) return null
  return { lng: coords[0], lat: coords[1] }
}

/**
 * Resuelve la URL de imagen del backend. Si viene relativa (`/media/...`),
 * la prefija con el origin de VITE_API_URL.
 */
export function resolveMediaUrl(path) {
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
 * Mapea un spot del backend a la forma que consumen las tarjetas/lista/mapa.
 * Calcula la distancia (km) desde `userPos` si está disponible.
 */
export function mapSpot(spot, userPos) {
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
