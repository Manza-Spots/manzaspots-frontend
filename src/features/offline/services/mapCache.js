import maplibregl from 'maplibre-gl'
import { isOffline } from '@/core/network/connectivity'
import { dbGet, dbPut, dbCount, dbGetAll, dbKeysByAge, dbDeleteMany } from './offlineDb'

// Los mapas que deben verse sin señal (Seguir y Grabar) piden el estilo con el
// esquema `ofm://` en lugar de `https://`. MapLibre manda esas peticiones a
// `handleRequest`, que guarda en IndexedDB lo que baja con red y lo sirve de
// ahí cuando no la hay.

const HOST = 'tiles.openfreemap.org'
const SCHEME = 'ofm'
const HTTPS_PREFIX = `https://${HOST}/`
const SCHEME_PREFIX = `${SCHEME}://${HOST}/`

// Estilo y TileJSON cambian (la URL de los mosaicos lleva una versión que rota):
// primero la red, pero sin hacer esperar más de esto si ya hay copia guardada.
const JSON_TIMEOUT_MS = 4000
// Un mosaico guardado se usa tal cual; pasado este tiempo se intenta renovar.
const TILE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000
// Mosaicos que se quedan de ir viendo el mapa (los de rutas descargadas no cuentan).
const MAX_BROWSE_TILES = 1500

export const mapStyleUrl = (dark) => `${SCHEME_PREFIX}styles/${dark ? 'positron' : 'liberty'}`

const toHttps = (url) => url.replace(`${SCHEME}://`, 'https://')
const toScheme = (text) => text.replaceAll(HTTPS_PREFIX, SCHEME_PREFIX)

// planet/<versión>/z/x/y.pbf → z/x/y: la misma clave aunque rote la versión.
const TILE_RE = /\/planet\/[^/]+\/(\d+)\/(\d+)\/(\d+)\.pbf$/
const tileKeyOf = (url) => {
  const m = url.match(TILE_RE)
  return m ? `${m[1]}/${m[2]}/${m[3]}` : null
}

async function fetchFromNetwork(url, type, signal) {
  const response = await fetch(toHttps(url), { signal })
  if (response.status === 204) return { data: new ArrayBuffer(0), bytes: 0 }
  if (!response.ok) throw new Error(`HTTP ${response.status} en ${url}`)
  if (type === 'json') {
    // Las URLs internas (TileJSON, sprites, fuentes) también pasan por la caché.
    const text = toScheme(await response.text())
    return { data: JSON.parse(text), bytes: text.length }
  }
  const data = await response.arrayBuffer()
  return { data, bytes: data.byteLength }
}

const save = (tileKey, url, entry) => {
  const value = { ...entry, savedAt: Date.now() }
  const write = tileKey ? dbPut('tiles', value, tileKey) : dbPut('assets', value, url)
  return write.catch((err) => console.warn('No se pudo guardar en la caché del mapa', err))
}

async function fetchAndSave(url, type, tileKey, signal) {
  const entry = await fetchFromNetwork(url, type, signal)
  await save(tileKey, url, entry)
  return entry
}

/**
 * Devuelve `{ data, bytes, cached }` de un recurso de OpenFreeMap (URL `ofm://`).
 * JSON: red primero con tope de espera. Mosaicos, sprites y fuentes: caché primero.
 */
export async function loadResource(url, type, signal) {
  const tileKey = tileKeyOf(url)
  const cached = await (tileKey ? dbGet('tiles', tileKey) : dbGet('assets', url)).catch(() => null)

  if (type === 'json') {
    if (cached && isOffline()) return { ...cached, cached: true }
    const network = fetchAndSave(url, type, null, signal)
    if (!cached) return network
    const timeout = new Promise((resolve) => setTimeout(resolve, JSON_TIMEOUT_MS, null))
    try {
      const fresh = await Promise.race([network, timeout])
      if (fresh) return fresh
    } catch {
      // Sin red: sirve la copia.
    }
    network.catch(() => {})
    return { ...cached, cached: true }
  }

  if (cached) {
    const stale = tileKey && Date.now() - cached.savedAt > TILE_MAX_AGE_MS
    if (!stale || isOffline()) return { ...cached, cached: true }
    try {
      return await fetchAndSave(url, type, tileKey, signal)
    } catch {
      return { ...cached, cached: true }
    }
  }
  return fetchAndSave(url, type, tileKey, signal)
}

async function handleRequest(params, abortController) {
  const { data } = await loadResource(params.url, params.type, abortController.signal)
  return { data }
}

// Borra los mosaicos más viejos de ir viendo el mapa; nunca los de una ruta descargada.
async function pruneBrowseTiles() {
  const total = await dbCount('tiles')
  if (total <= MAX_BROWSE_TILES) return
  const pinned = new Set((await dbGetAll('routes')).flatMap((r) => r.tiles))
  const keys = await dbKeysByAge('tiles')
  const loose = keys.filter((key) => !pinned.has(key))
  const extra = loose.length - MAX_BROWSE_TILES
  if (extra > 0) await dbDeleteMany('tiles', loose.slice(0, extra))
}

let registered = false

/** Registra el protocolo `ofm://` en MapLibre. Se puede llamar varias veces. */
export function registerMapCache() {
  if (registered) return
  registered = true
  maplibregl.addProtocol(SCHEME, handleRequest)
  setTimeout(() => {
    pruneBrowseTiles().catch((err) => console.warn('No se pudo podar la caché del mapa', err))
  }, 10000)
}

// ─── Descarga de un área ────────────────────────────────────────────────────────

const lngToX = (lng, z) => Math.floor(((lng + 180) / 360) * 2 ** z)
const latToY = (lat, z) => {
  const rad = (lat * Math.PI) / 180
  return Math.floor(((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 2 ** z)
}

/**
 * Claves z/x/y que cubren `bounds` ([[oeste, sur], [este, norte]]) en cada zoom.
 */
export function tileKeysForBounds([[west, south], [east, north]], minZoom, maxZoom) {
  const keys = []
  for (let z = minZoom; z <= maxZoom; z++) {
    const max = 2 ** z - 1
    const x0 = Math.max(lngToX(west, z), 0)
    const x1 = Math.min(lngToX(east, z), max)
    const y0 = Math.max(latToY(north, z), 0)
    const y1 = Math.min(latToY(south, z), max)
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) keys.push(`${z}/${x}/${y}`)
  }
  return keys
}

const fontStacks = (style) => {
  const stacks = new Set()
  style.layers.forEach((layer) => {
    const font = layer.layout?.['text-font']
    if (Array.isArray(font) && font.every((f) => typeof f === 'string')) stacks.add(font.join(','))
  })
  return [...stacks]
}

// Rangos de glifos: latín básico y latín-1, latín extendido, puntuación general
// y formas de ancho completo (las pide algún rótulo de OpenFreeMap).
const GLYPH_RANGES = ['0-255', '256-511', '8192-8447', '65280-65535']

/**
 * URLs que el mapa necesita además de los mosaicos: ambos estilos (claro y
 * oscuro), el TileJSON, los sprites y las fuentes. Devuelve también la plantilla
 * de los mosaicos.
 */
export async function styleAssetUrls() {
  const urls = new Set()
  let tileTemplate = null
  for (const styleUrl of [mapStyleUrl(false), mapStyleUrl(true)]) {
    urls.add(styleUrl)
    const { data: style } = await loadResource(styleUrl, 'json')
    Object.values(style.sources).forEach((source) => {
      if (source.type === 'vector' && source.url) urls.add(source.url)
    })
    const sprites = Array.isArray(style.sprite) ? style.sprite.map((s) => s.url) : [style.sprite]
    sprites.filter(Boolean).forEach((sprite) => {
      ;['', '@2x'].forEach((ratio) => {
        urls.add(`${sprite}${ratio}.json`)
        urls.add(`${sprite}${ratio}.png`)
      })
    })
    fontStacks(style).forEach((stack) =>
      GLYPH_RANGES.forEach((range) =>
        urls.add(style.glyphs.replace('{fontstack}', stack).replace('{range}', range))
      )
    )
    if (!tileTemplate) {
      const source = Object.values(style.sources).find((s) => s.type === 'vector' && s.url)
      const { data: tileJson } = await loadResource(source.url, 'json')
      tileTemplate = tileJson.tiles[0]
    }
  }
  return { urls: [...urls], tileTemplate }
}

/** Baja (o lee de la caché) un recurso del mapa y devuelve los bytes que ocupa. */
export async function cacheUrl(url) {
  const type = url.endsWith('.json') || !/\.(png|pbf)$/.test(url) ? 'json' : 'arrayBuffer'
  const { bytes } = await loadResource(url, type)
  return bytes ?? 0
}

export async function cacheTile(tileTemplate, key) {
  const [z, x, y] = key.split('/')
  const url = tileTemplate.replace('{z}', z).replace('{x}', x).replace('{y}', y)
  const { bytes } = await loadResource(url, 'arrayBuffer')
  return bytes ?? 0
}
