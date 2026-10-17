import { dbGet, dbPut, dbDelete, dbGetAll, dbDeleteMany } from './offlineDb'
import { styleAssetUrls, cacheUrl, cacheTile, tileKeysForBounds } from './mapCache'

// OpenFreeMap llega a z14; más cerca MapLibre amplía esos mismos mosaicos.
const MIN_ZOOM = 10
const MAX_ZOOM = 14
// Margen alrededor de la ruta: la perspectiva deja ver bastante por delante.
const MARGIN_M = 1500
const CONCURRENCY = 6

const keyOf = (spotId, routeId) => `${spotId}:${routeId}`

// IndexedDB no acepta los proxies reactivos de Vue: se guarda una copia plana.
const plain = (value) => JSON.parse(JSON.stringify(value))

/** Área de la ruta (y del spot) con el margen, como [[oeste, sur], [este, norte]]. */
function areaBounds(coordinates) {
  let west = Infinity
  let south = Infinity
  let east = -Infinity
  let north = -Infinity
  coordinates.forEach(([lng, lat]) => {
    west = Math.min(west, lng)
    east = Math.max(east, lng)
    south = Math.min(south, lat)
    north = Math.max(north, lat)
  })
  const dLat = MARGIN_M / 111320
  const dLng = MARGIN_M / (111320 * Math.cos((((south + north) / 2) * Math.PI) / 180))
  return [
    [west - dLng, south - dLat],
    [east + dLng, north + dLat],
  ]
}

// Ejecuta `task` sobre `items` con varias peticiones a la vez.
async function runPool(items, task) {
  let next = 0
  const worker = async () => {
    while (next < items.length) {
      const item = items[next++]
      await task(item)
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, worker))
}

const withRetry = async (fn) => {
  try {
    return await fn()
  } catch {
    return fn()
  }
}

/**
 * Descarga una ruta para seguirla sin señal: la ruta, su spot y el mapa del área.
 * @param {{ id, name, location }} spot     location: { lng, lat } o null
 * @param {{ id, description, path, travel_mode, distance, difficulty_name, travel_mode_name }} route
 * @param {(p: { done: number, total: number, bytes: number }) => void} onProgress
 */
export async function downloadRoute(spot, route, onProgress = () => {}) {
  const coords = route.path?.coordinates ?? []
  if (coords.length < 2) throw new Error('La ruta no tiene trazo')

  const area = spot.location ? [...coords, [spot.location.lng, spot.location.lat]] : coords
  const tiles = tileKeysForBounds(areaBounds(area), MIN_ZOOM, MAX_ZOOM)

  const progress = { done: 0, total: tiles.length + 1, bytes: 0 }
  onProgress({ ...progress })

  // Estilos, sprites y fuentes primero: de ahí sale la URL de los mosaicos.
  const { urls, tileTemplate } = await styleAssetUrls()
  progress.total += urls.length - 1
  await runPool(urls, async (url) => {
    // Primero el await: `+= await` leería el total de antes y perdería sumas.
    const bytes = await withRetry(() => cacheUrl(url))
    progress.bytes += bytes
    progress.done++
    onProgress({ ...progress })
  })

  await runPool(tiles, async (key) => {
    const bytes = await withRetry(() => cacheTile(tileTemplate, key))
    progress.bytes += bytes
    progress.done++
    onProgress({ ...progress })
  })

  const record = plain({
    key: keyOf(spot.id, route.id),
    spotId: spot.id,
    routeId: route.id,
    spot: { id: spot.id, name: spot.name, location: spot.location ?? null },
    route: {
      id: route.id,
      spot: spot.id,
      description: route.description ?? '',
      path: route.path,
      travel_mode: route.travel_mode ?? null,
      distance: route.distance ?? null,
      difficulty_name: route.difficulty_name ?? '',
      travel_mode_name: route.travel_mode_name ?? '',
    },
    tiles,
    bytes: progress.bytes,
    savedAt: Date.now(),
  })
  await dbPut('routes', record)
  return record
}

export function getOfflineRoute(spotId, routeId) {
  return dbGet('routes', keyOf(spotId, routeId)).catch(() => null)
}

/** Rutas descargadas, de la más reciente a la más vieja. */
export async function listOfflineRoutes() {
  const all = await dbGetAll('routes').catch(() => [])
  return all.sort((a, b) => b.savedAt - a.savedAt)
}

/** Borra la ruta y los mosaicos que ninguna otra ruta descargada usa. */
export async function deleteOfflineRoute(spotId, routeId) {
  const key = keyOf(spotId, routeId)
  const record = await dbGet('routes', key)
  if (!record) return
  await dbDelete('routes', key)
  const stillUsed = new Set((await dbGetAll('routes')).flatMap((r) => r.tiles))
  await dbDeleteMany(
    'tiles',
    record.tiles.filter((tile) => !stillUsed.has(tile))
  )
}
