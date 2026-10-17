// Simulador de GPS solo para desarrollo. Reproduce una polilínea de coordenadas
// predefinida emitiendo una posición cada ~1 s, con la misma forma que el callback
// de locationService. Se activa de forma opt-in con `?sim=1`; `&simSpeed=10`
// cambia la velocidad (m/s) al recorrer una ruta con `setPath`.
//
// No depende de la API ni de permisos del dispositivo.
import { haversineMeters } from '@/features/tracking/utils/geo'

// Tramo de ejemplo cerca de Manzanillo/Colima (defaultCenter del mapa real).
// Una caminata corta con ligera ganancia de altitud.
const BASE = { lat: 19.053333, lng: -104.316111, alt: 20 }
const WALKING_SPEED = 1.4
// Temblor lateral del GPS simulado, en metros.
const JITTER_M = 3

class GpsSimulator {
  constructor() {
    this.intervalId = null
    this.step = 0
    this.path = null
  }

  /**
   * Hace que el simulador camine sobre una ruta en lugar del tramo diagonal.
   * @param {Array<[number, number]>|null} coordinates  [lng, lat] del LineString.
   */
  setPath(coordinates) {
    if (!coordinates?.length) {
      this.path = null
      return
    }
    const points = coordinates.map(([lng, lat]) => ({ lat, lng }))
    const cumulative = [0]
    for (let i = 1; i < points.length; i++) {
      cumulative.push(cumulative[i - 1] + haversineMeters(points[i - 1], points[i]))
    }
    this.path = { points, cumulative }
  }

  // Posición a `step` segundos del inicio de la ruta, con temblor de GPS.
  buildPathPoint(step) {
    const { points, cumulative } = this.path
    const speed = Number(new URLSearchParams(window.location.search).get('simSpeed')) || WALKING_SPEED
    const along = Math.min(step * speed, cumulative.at(-1))
    let i = 1
    while (i < cumulative.length - 1 && cumulative[i] < along) i++
    const a = points[i - 1]
    const b = points[i]
    const t = (along - cumulative[i - 1]) / (cumulative[i] - cumulative[i - 1] || 1)
    const metersPerDegLat = 111320
    const metersPerDegLng = metersPerDegLat * Math.cos((a.lat * Math.PI) / 180)
    const heading =
      ((Math.atan2((b.lng - a.lng) * metersPerDegLng, (b.lat - a.lat) * metersPerDegLat) * 180) /
        Math.PI +
        360) %
      360
    const jitter = () => (Math.random() - 0.5) * 2 * JITTER_M
    return {
      latitude: a.lat + (b.lat - a.lat) * t + jitter() / metersPerDegLat,
      longitude: a.lng + (b.lng - a.lng) * t + jitter() / metersPerDegLng,
      accuracy: 5,
      altitude: BASE.alt,
      altitudeAccuracy: 5,
      speed,
      heading,
      timestamp: Date.now(),
    }
  }

  // Genera un punto sintético desplazándose en diagonal con variación de altitud.
  buildPoint(step) {
    if (this.path) return this.buildPathPoint(step)
    const drift = step * 0.00012 // ~13 m por paso
    return {
      latitude: BASE.lat + drift,
      longitude: BASE.lng + drift * 0.6,
      accuracy: 5,
      altitude: BASE.alt + Math.round(Math.sin(step / 4) * 6 + step * 0.4),
      altitudeAccuracy: 5,
      speed: 1.4,
      heading: 45,
      timestamp: Date.now(),
    }
  }

  async startTracking(callback) {
    if (this.intervalId) return
    this.step = 0

    // Primera posición inmediata para centrar el mapa al instante.
    callback(this.buildPoint(this.step++))

    this.intervalId = setInterval(() => {
      callback(this.buildPoint(this.step++))
    }, 1000)
  }

  async stopTracking() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  async getCurrentPosition() {
    const p = this.buildPoint(this.step)
    return {
      latitude: p.latitude,
      longitude: p.longitude,
      accuracy: p.accuracy,
      altitude: p.altitude,
      speed: p.speed,
      heading: p.heading,
      timestamp: p.timestamp,
    }
  }
}

export const gpsSimulator = new GpsSimulator()

/** True cuando la grabación debe usar el simulador en lugar del GPS real. */
export function isSimEnabled() {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).has('sim')
}
