// Guía para seguir una ruta grabada. Los senderos no tienen red de calles ni
// motor de rutas: las indicaciones salen de la forma del propio trazo.
//
// Todo se calcula en metros sobre una proyección local equirectangular, precisa
// para la escala de una ruta (unos pocos km).

const EARTH_RADIUS_M = 6371008.8
const DEG = Math.PI / 180

// Tolerancia de simplificación: el trazo del GPS tiembla unos metros y cada
// temblor parecería una curva.
const SIMPLIFY_TOLERANCE_M = 6
// Giros menores a esto se leen como "sigue recto".
const MIN_TURN_DEG = 30
// Dos curvas más juntas que esto se anuncian como una sola.
const MIN_TURN_GAP_M = 12
// Ventana de búsqueda alrededor del último avance: el avance nunca salta a
// otro tramo (el de vuelta en una ida y vuelta, un cruce, el final de un
// circuito). Lejos de la ventana se está fuera de la ruta.
const SEARCH_BACK_M = 60
const SEARCH_AHEAD_M = 400
// Histéresis del aviso de desvío.
const OFF_ROUTE_M = 35
const BACK_ON_ROUTE_M = 20
const ARRIVAL_M = 20

function makeProjection(lat0) {
  const kx = DEG * EARTH_RADIUS_M * Math.cos(lat0 * DEG)
  const ky = DEG * EARTH_RADIUS_M
  return {
    toXY: ([lng, lat]) => [lng * kx, lat * ky],
    toLngLat: ([x, y]) => [x / kx, y / ky],
  }
}

/** Rumbo en grados (0 = norte, sentido horario) del vector a→b en metros. */
function bearingXY(a, b) {
  const deg = Math.atan2(b[0] - a[0], b[1] - a[1]) / DEG
  return (deg + 360) % 360
}

/** Diferencia angular más corta de `from` a `to`, en (-180, 180]. */
export function angleDiff(from, to) {
  let d = (to - from) % 360
  if (d > 180) d -= 360
  if (d <= -180) d += 360
  return d
}

function simplify(xy, tolerance) {
  const keep = new Uint8Array(xy.length)
  keep[0] = keep[xy.length - 1] = 1
  const stack = [[0, xy.length - 1]]
  while (stack.length) {
    const [start, end] = stack.pop()
    const [ax, ay] = xy[start]
    const [bx, by] = xy[end]
    const dx = bx - ax
    const dy = by - ay
    const len = Math.hypot(dx, dy) || 1
    let maxDist = 0
    let index = -1
    for (let i = start + 1; i < end; i++) {
      const dist = Math.abs(dy * (xy[i][0] - ax) - dx * (xy[i][1] - ay)) / len
      if (dist > maxDist) {
        maxDist = dist
        index = i
      }
    }
    if (maxDist > tolerance) {
      keep[index] = 1
      stack.push([start, index], [index, end])
    }
  }
  const indices = []
  keep.forEach((k, i) => k && indices.push(i))
  return indices
}

function classifyTurn(angle) {
  const abs = Math.abs(angle)
  if (abs >= 165) return 'uturn'
  if (abs >= 130) return 'sharp'
  if (abs >= 60) return 'turn'
  return 'slight'
}

/**
 * Prepara una ruta para seguirla.
 * @param {Array<[number, number]>} coordinates  Coordenadas [lng, lat] del LineString.
 */
export function createRouteGuide(coordinates) {
  const coords = coordinates.filter(
    (c, i) => i === 0 || c[0] !== coordinates[i - 1][0] || c[1] !== coordinates[i - 1][1],
  )
  if (coords.length < 2) return null

  const midLat = coords.reduce((sum, c) => sum + c[1], 0) / coords.length
  const projection = makeProjection(midLat)
  const xy = coords.map(projection.toXY)

  const cumulative = [0]
  for (let i = 1; i < xy.length; i++) {
    cumulative.push(cumulative[i - 1] + Math.hypot(xy[i][0] - xy[i - 1][0], xy[i][1] - xy[i - 1][1]))
  }
  const totalM = cumulative.at(-1)

  const kept = simplify(xy, SIMPLIFY_TOLERANCE_M)
  const maneuvers = []
  for (let k = 1; k < kept.length - 1; k++) {
    const prev = xy[kept[k - 1]]
    const here = xy[kept[k]]
    const next = xy[kept[k + 1]]
    const angle = angleDiff(bearingXY(prev, here), bearingXY(here, next))
    if (Math.abs(angle) < MIN_TURN_DEG) continue

    const maneuver = {
      atM: cumulative[kept[k]],
      type: classifyTurn(angle),
      side: angle > 0 ? 'right' : 'left',
      angle,
    }
    const last = maneuvers.at(-1)
    if (last && maneuver.atM - last.atM < MIN_TURN_GAP_M) {
      if (Math.abs(angle) > Math.abs(last.angle)) maneuvers[maneuvers.length - 1] = maneuver
    } else {
      maneuvers.push(maneuver)
    }
  }

  // Punto del trazo a `alongM` metros del inicio, en metros proyectados.
  const pointAtXY = (alongM) => {
    const target = Math.min(Math.max(alongM, 0), totalM)
    let i = 1
    while (i < cumulative.length - 1 && cumulative[i] < target) i++
    const segLen = cumulative[i] - cumulative[i - 1] || 1
    const t = (target - cumulative[i - 1]) / segLen
    const a = xy[i - 1]
    const b = xy[i]
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
  }

  const nearest = (p, fromM, toM) => {
    let best = null
    for (let i = 1; i < xy.length; i++) {
      if (cumulative[i] < fromM || cumulative[i - 1] > toM) continue
      const a = xy[i - 1]
      const b = xy[i]
      const dx = b[0] - a[0]
      const dy = b[1] - a[1]
      const lenSq = dx * dx + dy * dy || 1
      const t = Math.min(Math.max(((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / lenSq, 0), 1)
      const q = [a[0] + dx * t, a[1] + dy * t]
      const distance = Math.hypot(p[0] - q[0], p[1] - q[1])
      if (!best || distance < best.distance) {
        best = { distance, alongM: cumulative[i - 1] + Math.sqrt(lenSq) * t, point: q }
      }
    }
    return best
  }

  return {
    totalM,
    maneuvers,
    start: coords[0],
    end: coords.at(-1),

    /** Rumbo del trazo hacia adelante desde `alongM`, mirando `lookAheadM` metros. */
    bearingAt(alongM, lookAheadM = 25) {
      const from = Math.min(alongM, totalM - 1)
      return bearingXY(pointAtXY(from), pointAtXY(from + lookAheadM))
    },

    /**
     * Ubica una posición sobre la ruta.
     * @param {[number, number]} lngLat
     * @param {object} [previous]  Estado anterior (ventana de búsqueda e histéresis).
     *   Sin él se busca en toda la ruta; para empezar desde el inicio, `{ progressM: 0 }`.
     * @param {object} [options]
     * @param {number} [options.aheadM]  Cuánto puede avanzar desde `previous`. Quien
     *   sigue la ruta lo limita a lo que se puede recorrer desde la última lectura,
     *   para que un atajo o una curva cerrada (zigzag) no adelanten el avance.
     */
    locate(lngLat, previous = null, { aheadM = SEARCH_AHEAD_M } = {}) {
      const p = projection.toXY(lngLat)
      const hit = previous
        ? nearest(p, previous.progressM - SEARCH_BACK_M, previous.progressM + aheadM)
        : nearest(p, -Infinity, Infinity)

      const wasOff = previous?.offRoute ?? false
      const offRoute = wasOff ? hit.distance > BACK_ON_ROUTE_M : hit.distance > OFF_ROUTE_M
      const progressM = hit.alongM
      const remainingM = Math.max(totalM - progressM, 0)
      const next = maneuvers.find((m) => m.atM > progressM + 3) ?? null

      return {
        progressM,
        remainingM,
        offRouteM: hit.distance,
        offRoute,
        snapped: projection.toLngLat(hit.point),
        nextManeuver: next ? { ...next, distanceM: next.atM - progressM } : null,
        arrived: remainingM < ARRIVAL_M && !offRoute,
      }
    },
  }
}
