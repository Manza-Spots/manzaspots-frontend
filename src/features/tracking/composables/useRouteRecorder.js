import { computed, ref, onBeforeUnmount } from 'vue'
import { locationService } from '@/features/tracking/services/locationService'
import { gpsSimulator, isSimEnabled } from '@/features/tracking/services/gpsSimulator'
import { storage } from '@/core/storage'
import { totalDistanceKm, elevationGainM, toGeoJSON, toGPX } from '@/features/tracking/utils/geo'

const LAST_ROUTE_KEY = 'manzaspots:lastRoute'

/**
 * Grabadora de rutas: posee la suscripción al GPS (real o simulado) y expone
 * el estado reactivo de la grabación. Es la única fuente de verdad; el mapa
 * solo renderiza `points`.
 */
export function useRouteRecorder() {
  const source = isSimEnabled() ? gpsSimulator : locationService

  const status = ref('idle') // idle | recording | paused
  const points = ref([])
  const distanceKm = ref(0)
  const elevationM = ref(0)
  const elapsedSeconds = ref(0)
  const lastTrack = ref(null) // última ruta finalizada (para exportar tras reset)

  let timer = null

  const startTimer = () => {
    if (timer) return
    timer = setInterval(() => {
      elapsedSeconds.value += 1
    }, 1000)
  }

  const stopTimer = () => {
    clearInterval(timer)
    timer = null
  }

  const handlePosition = (pos) => {
    if (status.value !== 'recording') return

    points.value.push({
      lat: pos.latitude,
      lng: pos.longitude,
      alt: pos.altitude ?? null,
      accuracy: pos.accuracy ?? null,
      timestamp: pos.timestamp ?? Date.now(),
    })

    distanceKm.value = totalDistanceKm(points.value)
    elevationM.value = elevationGainM(points.value)
  }

  const start = async () => {
    if (status.value === 'recording') return
    status.value = 'recording'
    startTimer()
    try {
      await source.startTracking(handlePosition)
    } catch (err) {
      console.warn('No se pudo iniciar el tracking GPS', err)
    }
  }

  const pause = () => {
    if (status.value !== 'recording') return
    status.value = 'paused'
    stopTimer()
  }

  const resume = () => {
    if (status.value !== 'paused') return
    status.value = 'recording'
    startTimer()
  }

  const buildTrack = () => ({
    startedAt: points.value[0]?.timestamp ?? null,
    finishedAt: points.value.at(-1)?.timestamp ?? null,
    distanceKm: distanceKm.value,
    elevationM: elevationM.value,
    durationSeconds: elapsedSeconds.value,
    points: points.value,
    geojson: toGeoJSON(points.value),
  })

  const finish = async () => {
    stopTimer()
    await source.stopTracking()

    const track = buildTrack()
    lastTrack.value = track
    console.log('[RouteRecorder] Ruta finalizada (GeoJSON):', track.geojson)

    try {
      await storage.set(LAST_ROUTE_KEY, track)
    } catch (err) {
      console.warn('No se pudo guardar la ruta localmente', err)
    }

    reset()
    return track
  }

  function reset() {
    status.value = 'idle'
    points.value = []
    distanceKm.value = 0
    elevationM.value = 0
    elapsedSeconds.value = 0
  }

  /** Descarga la última ruta (o la actual) como archivo GeoJSON/GPX. */
  const downloadTrack = (format = 'geojson') => {
    const data = points.value.length ? points.value : lastTrack.value?.points
    if (!data?.length) return

    const isGpx = format === 'gpx'
    const content = isGpx ? toGPX(data) : JSON.stringify(toGeoJSON(data), null, 2)
    const mime = isGpx ? 'application/gpx+xml' : 'application/geo+json'
    const ext = isGpx ? 'gpx' : 'geojson'

    try {
      const blob = new Blob([content], { type: mime })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `manzaspots-route-${Date.now()}.${ext}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.warn('No se pudo descargar la ruta, se muestra en consola', err)
      console.log(content)
    }
  }

  const formattedTime = computed(() => {
    const m = Math.floor(elapsedSeconds.value / 60)
    const s = elapsedSeconds.value % 60
    return { minutes: String(m), seconds: String(s).padStart(2, '0') }
  })

  onBeforeUnmount(() => {
    stopTimer()
    source.stopTracking()
  })

  return {
    status,
    points,
    distanceKm,
    elevationM,
    elapsedSeconds,
    formattedTime,
    lastTrack,
    isSim: isSimEnabled(),
    start,
    pause,
    resume,
    finish,
    reset,
    downloadTrack,
  }
}
