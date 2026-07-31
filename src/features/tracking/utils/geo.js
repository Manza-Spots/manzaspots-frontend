// Utilidades geográficas puras para la grabación de rutas.
// Un "point" tiene la forma: { lat, lng, alt, accuracy, timestamp }

const EARTH_RADIUS_M = 6371000

const toRad = (deg) => (deg * Math.PI) / 180

/** Distancia en metros entre dos puntos {lat,lng} (fórmula de Haversine). */
export function haversineMeters(a, b) {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2

  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h))
}

/** Distancia total acumulada de una ruta, en kilómetros. */
export function totalDistanceKm(points) {
  if (!points || points.length < 2) return 0

  let meters = 0
  for (let i = 1; i < points.length; i++) {
    meters += haversineMeters(points[i - 1], points[i])
  }
  return meters / 1000
}

/**
 * Desnivel positivo acumulado en metros. Solo suma subidas y aplica un umbral
 * para filtrar el ruido típico de la altitud del GPS.
 */
export function elevationGainM(points, threshold = 1) {
  if (!points || points.length < 2) return 0

  let gain = 0
  let lastAlt = null

  for (const p of points) {
    if (p.alt == null) continue
    if (lastAlt != null) {
      const diff = p.alt - lastAlt
      if (diff > threshold) gain += diff
    }
    lastAlt = p.alt
  }
  return Math.round(gain)
}

/** Convierte la ruta en un Feature<LineString> GeoJSON ([lng, lat, alt?]). */
export function toGeoJSON(points) {
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: (points || []).map((p) =>
        p.alt != null ? [p.lng, p.lat, p.alt] : [p.lng, p.lat],
      ),
    },
  }
}

/** Convierte la ruta en una cadena GPX 1.1 (track con un único segmento). */
export function toGPX(points, name = 'Manzaspots route') {
  const pts = (points || [])
    .map((p) => {
      const ele = p.alt != null ? `<ele>${p.alt}</ele>` : ''
      const time = p.timestamp ? `<time>${new Date(p.timestamp).toISOString()}</time>` : ''
      return `      <trkpt lat="${p.lat}" lon="${p.lng}">${ele}${time}</trkpt>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Manzaspots" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>${name}</name>
    <trkseg>
${pts}
    </trkseg>
  </trk>
</gpx>`
}
