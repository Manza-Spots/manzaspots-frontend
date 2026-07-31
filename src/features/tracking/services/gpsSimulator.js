// Simulador de GPS solo para desarrollo. Reproduce una polilínea de coordenadas
// predefinida emitiendo una posición cada ~1 s, con la misma forma que el callback
// de locationService. Se activa de forma opt-in con `?sim=1`.
//
// No depende de la API ni de permisos del dispositivo.

// Tramo de ejemplo cerca de Manzanillo/Colima (defaultCenter del mapa real).
// Una caminata corta con ligera ganancia de altitud.
const BASE = { lat: 19.053333, lng: -104.316111, alt: 20 }

class GpsSimulator {
  constructor() {
    this.intervalId = null
    this.step = 0
  }

  // Genera un punto sintético desplazándose en diagonal con variación de altitud.
  buildPoint(step) {
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
