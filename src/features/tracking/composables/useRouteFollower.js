import { computed, ref, shallowRef, onBeforeUnmount } from 'vue'
import { Capacitor } from '@capacitor/core'
import { KeepAwake } from '@capacitor-community/keep-awake'
import { locationService } from '@/features/tracking/services/locationService'
import { headingService } from '@/features/tracking/services/headingService'
import { gpsSimulator, isSimEnabled } from '@/features/tracking/services/gpsSimulator'
import { haversineMeters } from '@/features/tracking/utils/geo'

// Por debajo de esta velocidad el rumbo del GPS es ruido: manda la brújula.
const MOVING_SPEED = 0.6
// Distancia mínima entre posiciones para calcular un rumbo con ellas.
const MIN_COURSE_STEP_M = 4
const SPEED_SMOOTHING = 0.25
// Velocidad típica (m/s) por modo de viaje, para estimar la llegada estando parado.
const FALLBACK_SPEED = { walk: 1.3, run: 2.8, cicle: 5, kayak: 1.5, moto: 10, car: 10 }

const toLngLat = (pos) => [pos.longitude, pos.latitude]
const validHeading = (h) => Number.isFinite(h) && h >= 0

/**
 * Sigue una ruta existente: escucha el GPS (real o simulado) y la brújula, ubica
 * cada posición sobre la ruta y deja la pantalla encendida mientras dura.
 *
 * @param {import('vue').Ref} guide  Resultado de createRouteGuide.
 * @param {import('vue').Ref<string>} travelMode  Clave del modo de viaje de la ruta.
 */
export function useRouteFollower(guide, travelMode) {
  const isSim = isSimEnabled()
  const source = isSim ? gpsSimulator : locationService

  const status = ref('idle') // idle | following | arrived
  const error = ref(null)
  const rawPosition = ref(null)
  const state = shallowRef(null)
  const compassHeading = ref(null)
  const compassUnreliable = ref(false)
  const gpsCourse = ref(null)
  const speed = ref(0)
  const elapsedSeconds = ref(0)

  let lastFix = null
  let timer = null

  const handlePosition = (pos) => {
    if (status.value === 'idle' || !guide.value) return

    const lngLat = toLngLat(pos)
    const now = pos.timestamp ?? Date.now()
    const point = { lat: pos.latitude, lng: pos.longitude }
    const stepM = lastFix ? haversineMeters(lastFix.point, point) : 0
    const dt = lastFix ? (now - lastFix.time) / 1000 : 0

    const measured = Number.isFinite(pos.speed) && pos.speed >= 0 ? pos.speed : dt > 0 ? stepM / dt : 0
    speed.value = lastFix ? speed.value + (measured - speed.value) * SPEED_SMOOTHING : measured

    if (validHeading(pos.heading) && measured > MOVING_SPEED) {
      gpsCourse.value = pos.heading
    } else if (stepM >= MIN_COURSE_STEP_M) {
      const metersPerDegLng = 111320 * Math.cos((point.lat * Math.PI) / 180)
      const dx = (point.lng - lastFix.point.lng) * metersPerDegLng
      const dy = (point.lat - lastFix.point.lat) * 111320
      gpsCourse.value = ((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360
    }
    if (!lastFix || stepM >= MIN_COURSE_STEP_M) lastFix = { point, time: now }

    rawPosition.value = lngLat
    state.value = guide.value.locate(lngLat, state.value)

    if (state.value.arrived && status.value === 'following') {
      status.value = 'arrived'
      stopTimer()
    }
  }

  const isMoving = computed(() => speed.value > MOVING_SPEED)

  // Rumbo de la cámara. En marcha y sobre la ruta manda el trazo, que no
  // tiembla (como Waze, que se pega a la calle). Parado o fuera de la ruta,
  // la brújula; sin brújula (web), el rumbo del GPS.
  const cameraHeading = computed(() => {
    const s = state.value
    if (s && !s.offRoute && isMoving.value) return guide.value.bearingAt(s.progressM)
    if (compassHeading.value != null) return compassHeading.value
    if (gpsCourse.value != null) return gpsCourse.value
    return s ? guide.value.bearingAt(s.progressM) : guide.value?.bearingAt(0) ?? 0
  })

  // La flecha apunta hacia donde mira el teléfono (o hacia donde avanzas).
  const userHeading = computed(() => compassHeading.value ?? gpsCourse.value ?? cameraHeading.value)

  // Sobre la ruta, la posición se pega al trazo para no temblar de lado.
  const displayPosition = computed(() => {
    const s = state.value
    if (!s) return rawPosition.value
    return s.offRoute ? rawPosition.value : s.snapped
  })

  const etaSeconds = computed(() => {
    if (!state.value) return null
    const fallback = FALLBACK_SPEED[travelMode.value] ?? FALLBACK_SPEED.walk
    const pace = speed.value > MOVING_SPEED ? speed.value : fallback
    return state.value.remainingM / pace
  })

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

  const start = async () => {
    if (status.value !== 'idle' || !guide.value) return
    status.value = 'following'
    error.value = null
    startTimer()

    if (Capacitor.isNativePlatform()) {
      KeepAwake.keepAwake().catch((err) => console.warn('No se pudo mantener la pantalla', err))
    }
    headingService.start(
      (heading) => {
        compassHeading.value = heading
      },
      (unreliable) => {
        compassUnreliable.value = unreliable
      },
    )

    try {
      await source.startTracking(handlePosition)
    } catch (err) {
      console.warn('No se pudo iniciar el GPS para seguir la ruta', err)
      error.value = 'location'
      await stop()
    }
  }

  const stop = async () => {
    if (status.value === 'idle' && !timer) return
    status.value = 'idle'
    stopTimer()
    lastFix = null
    if (Capacitor.isNativePlatform()) KeepAwake.allowSleep().catch(() => {})
    await Promise.allSettled([source.stopTracking(), headingService.stop()])
  }

  onBeforeUnmount(stop)

  return {
    status,
    error,
    isSim,
    state,
    displayPosition,
    cameraHeading,
    userHeading,
    compassUnreliable,
    speed,
    elapsedSeconds,
    etaSeconds,
    start,
    stop,
  }
}
