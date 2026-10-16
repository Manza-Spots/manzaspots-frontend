import { computed, ref, shallowRef, toRaw, onBeforeUnmount } from 'vue'
import { locationService } from '@/features/tracking/services/locationService'
import { gpsSimulator, isSimEnabled } from '@/features/tracking/services/gpsSimulator'
import { storage } from '@/core/storage'
import { totalDistanceKm, elevationGainM, toGeoJSON, toGPX } from '@/features/tracking/utils/geo'

const LAST_ROUTE_KEY = 'manzaspots:lastRoute'

// Fotos del recorrido pendientes de subir. Viven a nivel de módulo para
// sobrevivir a la navegación (p. ej. ir a iniciar sesión antes de guardar);
// un File no se puede persistir en Preferences.
const pendingPhotos = ref([])

function clearPendingPhotos() {
  pendingPhotos.value.forEach((photo) => URL.revokeObjectURL(photo.url))
  pendingPhotos.value = []
}

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
  // Última ruta finalizada (para guardar/exportar tras el reset). shallowRef:
  // puede tener miles de puntos y no necesita reactividad profunda.
  const lastTrack = shallowRef(null)

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

  // Recupera la última ruta finalizada (p. ej. tras volver de iniciar sesión).
  storage.get(LAST_ROUTE_KEY).then((track) => {
    if (!lastTrack.value && track?.points?.length) lastTrack.value = track
  })

  const start = async () => {
    if (status.value === 'recording') return
    clearPendingPhotos()
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

  // Copia cruda de los puntos: reset() reemplaza el array, así que el track no
  // cambia después, y no carga proxies reactivos a la UI ni al storage.
  const buildTrack = () => {
    const raw = toRaw(points.value)
    return {
      startedAt: raw[0]?.timestamp ?? null,
      finishedAt: raw.at(-1)?.timestamp ?? null,
      distanceKm: distanceKm.value,
      elevationM: elevationM.value,
      durationSeconds: elapsedSeconds.value,
      points: raw,
    }
  }

  const persistTrack = async (track) => {
    try {
      await storage.set(LAST_ROUTE_KEY, track)
    } catch (err) {
      console.warn('No se pudo guardar la ruta localmente', err)
    }
  }

  /**
   * Termina la grabación y devuelve la ruta (null si no había una en curso).
   * Es síncrono a propósito: la UI vuelve a "listo" de inmediato; liberar el
   * GPS y persistir la ruta corren en segundo plano y no la bloquean.
   */
  const finish = () => {
    if (status.value === 'idle') return null

    stopTimer()
    const track = buildTrack()
    lastTrack.value = track
    reset()

    source.stopTracking()
    persistTrack(track)
    return track
  }

  function reset() {
    status.value = 'idle'
    points.value = []
    distanceKm.value = 0
    elevationM.value = 0
    elapsedSeconds.value = 0
  }

  /**
   * Agrega una foto al recorrido, ubicada en el último punto grabado (o en la
   * posición actual si aún no hay puntos).
   */
  const addPhoto = async (file) => {
    let at = points.value.at(-1)
    if (!at) {
      const pos = await source.getCurrentPosition()
      at = { lat: pos.latitude, lng: pos.longitude }
    }
    pendingPhotos.value.push({
      file,
      url: URL.createObjectURL(file),
      location: { lat: at.lat, lng: at.lng },
    })
  }

  /** Marca la última ruta como guardada en el backend y descarta sus fotos. */
  const markSaved = async () => {
    if (!lastTrack.value) return
    lastTrack.value = { ...lastTrack.value, saved: true }
    clearPendingPhotos()
    await persistTrack(lastTrack.value)
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
    photos: pendingPhotos,
    isSim: isSimEnabled(),
    start,
    pause,
    resume,
    finish,
    reset,
    addPhoto,
    markSaved,
    downloadTrack,
  }
}
