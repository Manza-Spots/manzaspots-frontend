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

export function mapSpotDetail(spot, userPos) {
  const base = mapSpot(spot, userPos)

  const captions = (spot.spot_caption ?? [])
    .map((caption) => ({
      id: caption.id,
      url: resolveMediaUrl(caption.img_path),
      description: caption.description ?? '',
      userName: caption.user_name ?? '',
    }))
    .filter((photo) => photo.url)

  return {
    ...base,
    gallery: base.imageUrl
      ? [{ id: 'thumb', url: base.imageUrl, description: '', userName: '' }, ...captions]
      : captions,
  }
}

export function mapRoute(route) {
  return {
    id: route.id,
    spotId: route.spot,
    description: route.description,
    distanceKm: route.distance ?? null,
    difficultyName: route.difficulty_name ?? '',
    travelModeName: route.travel_mode_name ?? '',
    userName: route.user_name ?? '',
    isFavorite: route.is_favorite ?? false,
    path: route.path ?? null,
    photos: (route.route_photos ?? [])
      .map((photo) => resolveMediaUrl(photo.img_path))
      .filter(Boolean),
  }
}
