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
// La ruta empieza a contar cerca de su inicio y con una lectura precisa: una
// ubicación aproximada (cientos de metros) no puede darla por empezada.
const START_RADIUS_M = 100
const MAX_START_ACCURACY_M = 50
// Fuera del trazo un rato seguido (no un salto del GPS) obliga a reiniciar.
const OFF_ROUTE_GRACE_MS = 10000
// Velocidad máxima creíble (m/s) por modo de viaje: limita cuánto puede avanzar
// el progreso entre dos lecturas, con un margen fijo para el error del GPS.
const MAX_SPEED = { walk: 3, run: 6, cicle: 15, kayak: 4, moto: 40, car: 40 }
const AHEAD_SLACK_M = 30
// Posición que ya tenía la app (de otra pantalla) que vale para arrancar.
const KNOWN_POSITION_MAX_AGE_MS = 5 * 60 * 1000

const toLngLat = (pos) => [pos.longitude, pos.latitude]
const validHeading = (h) => Number.isFinite(h) && h >= 0

const canStartAt = (distanceM, accuracyM) =>
  distanceM != null &&
  distanceM <= START_RADIUS_M &&
  (accuracyM == null || accuracyM <= MAX_START_ACCURACY_M)

function bearingBetween(from, to) {
  const metersPerDegLng = 111320 * Math.cos((from.lat * Math.PI) / 180)
  const dx = (to.lng - from.lng) * metersPerDegLng
  const dy = (to.lat - from.lat) * 111320
  return ((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360
}

/**
 * Sigue una ruta existente: escucha el GPS (real o simulado) y la brújula, ubica
 * cada posición sobre la ruta y deja la pantalla encendida mientras dura.
 *
 * Fases: locating (sin ubicación) → approaching (lejos del inicio) → ready (en el
 * radio del inicio; el usuario toca Iniciar) → following → offRoute (se salió:
 * hay que reiniciar) o arrived. El avance solo crece sobre el trazo; salirse y
 * volver a entrar en otro punto no lo adelanta.
 *
 * @param {import('vue').Ref} guide  Resultado de createRouteGuide.
 * @param {import('vue').Ref<string>} travelMode  Clave del modo de viaje de la ruta.
 */
export function useRouteFollower(guide, travelMode) {
  const isSim = isSimEnabled()
  const source = isSim ? gpsSimulator : locationService

  const phase = ref('locating')
  const error = ref(null)
  const rawPosition = ref(null)
  const accuracy = ref(null)
  const distanceToStartM = ref(null)
  // Ya pisó el trazo: hasta entonces no hay "fuera de la ruta".
  const joined = ref(false)
  const state = shallowRef(null)
  const offRouteM = ref(0)
  const compassHeading = ref(null)
  const compassUnreliable = ref(false)
  const gpsCourse = ref(null)
  const speed = ref(0)
  const elapsedSeconds = ref(0)

  let running = false
  let lastFix = null
  let lastRouteFixTime = null
  let offRouteSince = null
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

  const trackMotion = (pos, point, now) => {
    const stepM = lastFix ? haversineMeters(lastFix.point, point) : 0
    const dt = lastFix ? (now - lastFix.time) / 1000 : 0
    const measured = Number.isFinite(pos.speed) && pos.speed >= 0 ? pos.speed : dt > 0 ? stepM / dt : 0
    speed.value = lastFix ? speed.value + (measured - speed.value) * SPEED_SMOOTHING : measured

    if (validHeading(pos.heading) && measured > MOVING_SPEED) {
      gpsCourse.value = pos.heading
    } else if (stepM >= MIN_COURSE_STEP_M) {
      gpsCourse.value = bearingBetween(lastFix.point, point)
    }
    if (!lastFix || stepM >= MIN_COURSE_STEP_M) lastFix = { point, time: now }
  }

  const handlePosition = (pos) => {
    if (!running || !guide.value) return

    const lngLat = toLngLat(pos)
    const now = pos.timestamp ?? Date.now()
    const point = { lat: pos.latitude, lng: pos.longitude }
    // Una posición guardada es vieja: no sirve para velocidad ni rumbo.
    if (!pos.cached) trackMotion(pos, point, now)

    rawPosition.value = lngLat
    accuracy.value = Number.isFinite(pos.accuracy) ? pos.accuracy : null
    const [startLng, startLat] = guide.value.start
    distanceToStartM.value = haversineMeters(point, { lat: startLat, lng: startLng })

    if (phase.value === 'arrived') return
    if (phase.value === 'offRoute') {
      // El avance queda congelado; solo se actualiza a cuánto está del trazo.
      offRouteM.value = guide.value.locate(lngLat, state.value).offRouteM
      return
    }

    if (phase.value === 'following') {
      trackRoute(lngLat, now)
      return
    }
    // Antes de iniciar: solo se decide si el botón Iniciar está disponible. Una
    // posición guardada (puede tener minutos) orienta, pero no habilita Iniciar.
    const fresh = !pos.cached
    phase.value =
      fresh && canStartAt(distanceToStartM.value, accuracy.value) ? 'ready' : 'approaching'
  }

  const resetProgress = () => {
    stopTimer()
    elapsedSeconds.value = 0
    state.value = null
    joined.value = false
    offRouteSince = null
    lastRouteFixTime = null
    offRouteM.value = 0
  }

  const trackRoute = (lngLat, now) => {
    const previous = state.value ?? { progressM: 0, offRoute: false }
    const dt = lastRouteFixTime ? Math.max((now - lastRouteFixTime) / 1000, 1) : 1
    const maxSpeed = MAX_SPEED[travelMode.value] ?? MAX_SPEED.walk
    const next = guide.value.locate(lngLat, previous, { aheadM: AHEAD_SLACK_M + maxSpeed * dt })
    offRouteM.value = next.offRouteM

    if (!joined.value) {
      if (!next.offRoute) {
        joined.value = true
      } else if (distanceToStartM.value > START_RADIUS_M) {
        // Se alejó del inicio antes de llegar al trazo: hay que volver a iniciar.
        resetProgress()
        phase.value = 'approaching'
        return
      }
      state.value = joined.value ? next : { ...next, progressM: 0 }
      lastRouteFixTime = now
      return
    }

    if (next.offRoute) {
      // El avance se queda donde se salió: volver a entrar más adelante no cuenta.
      state.value = { ...previous, offRoute: true, offRouteM: next.offRouteM }
      offRouteSince ??= now
      if (now - offRouteSince >= OFF_ROUTE_GRACE_MS) {
        phase.value = 'offRoute'
        stopTimer()
      }
      return
    }

    offRouteSince = null
    lastRouteFixTime = now
    state.value = next

    if (next.arrived) {
      phase.value = 'arrived'
      stopTimer()
    }
  }

  // El usuario toca Iniciar; solo cuenta estando en el radio del inicio.
  const begin = () => {
    if (phase.value !== 'ready') return false
    resetProgress()
    phase.value = 'following'
    startTimer()
    if (rawPosition.value) trackRoute(rawPosition.value, Date.now())
    return true
  }

  const isMoving = computed(() => speed.value > MOVING_SPEED)
  const onRoute = computed(
    () => phase.value === 'following' && joined.value && !!state.value && !state.value.offRoute,
  )

  // Rumbo de la cámara. En marcha y sobre la ruta manda el trazo, que no
  // tiembla (como Waze, que se pega a la calle). Parado o fuera de ella, la
  // brújula; sin brújula (web), el rumbo del GPS o la dirección al inicio.
  const cameraHeading = computed(() => {
    const g = guide.value
    if (!g) return 0
    if (onRoute.value && isMoving.value) return g.bearingAt(state.value.progressM)
    if (compassHeading.value != null) return compassHeading.value
    if (gpsCourse.value != null) return gpsCourse.value
    if (rawPosition.value && !joined.value) {
      const [lng, lat] = rawPosition.value
      return bearingBetween({ lat, lng }, { lat: g.start[1], lng: g.start[0] })
    }
    return g.bearingAt(state.value?.progressM ?? 0)
  })

  // La flecha apunta hacia donde mira el teléfono (o hacia donde avanzas).
  const userHeading = computed(() => compassHeading.value ?? gpsCourse.value ?? cameraHeading.value)

  // Sobre la ruta, la posición se pega al trazo para no temblar de lado.
  const displayPosition = computed(() => (onRoute.value ? state.value.snapped : rawPosition.value))

  // Línea recta hasta el inicio mientras no se ha pisado el trazo.
  const approachLine = computed(() => {
    if (!rawPosition.value || !guide.value || joined.value) return null
    if (!['approaching', 'ready', 'following'].includes(phase.value)) return null
    return [rawPosition.value, guide.value.start]
  })

  // Antes de pisar el trazo falta la ruta completa.
  const remainingM = computed(() =>
    joined.value && state.value ? state.value.remainingM : (guide.value?.totalM ?? 0),
  )
  const progressM = computed(() => (joined.value ? (state.value?.progressM ?? 0) : 0))

  const etaSeconds = computed(() => {
    if (!guide.value) return null
    const fallback = FALLBACK_SPEED[travelMode.value] ?? FALLBACK_SPEED.walk
    const pace = onRoute.value && isMoving.value ? speed.value : fallback
    return remainingM.value / pace
  })

  // Vuelve a empezar: el avance y el tiempo se borran y hay que regresar al
  // inicio y tocar Iniciar otra vez.
  const restart = () => {
    resetProgress()
    if (!rawPosition.value) phase.value = 'locating'
    else phase.value = canStartAt(distanceToStartM.value, accuracy.value) ? 'ready' : 'approaching'
  }

  // La app suele saber ya dónde estás (el mapa de spots, el detalle...): se usa
  // al instante mientras el GPS consigue una lectura fresca. Si no la tiene, se
  // pide una aproximada, que llega mucho antes que la precisa.
  const seedPosition = () => {
    const known = source.getLastKnownPosition?.(KNOWN_POSITION_MAX_AGE_MS)
    if (known) {
      handlePosition({ ...known, cached: true })
    } else {
      source
        .getCurrentPosition({ enableHighAccuracy: false, maximumAge: 2 * 60 * 1000, timeout: 8000 })
        .then((pos) => {
          if (running && !rawPosition.value && pos) handlePosition({ ...pos, cached: true })
        })
        .catch(() => {})
    }
    // Y una lectura nueva aunque el teléfono esté quieto: el watch compartido
    // solo manda posiciones al moverse y, sin una fresca, Iniciar no se habilita.
    source
      .getCurrentPosition({ enableHighAccuracy: true, maximumAge: 0, timeout: 20000 })
      .then((pos) => {
        if (running && pos) handlePosition(pos)
      })
      .catch(() => {})
  }

  const start = async () => {
    if (running || !guide.value) return
    running = true
    error.value = null

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

    seedPosition()
    try {
      await source.startTracking(handlePosition)
    } catch (err) {
      console.warn('No se pudo iniciar el GPS para seguir la ruta', err)
      error.value = 'location'
      await stop()
    }
  }

  const stop = async () => {
    if (!running) return
    running = false
    stopTimer()
    lastFix = null
    if (Capacitor.isNativePlatform()) KeepAwake.allowSleep().catch(() => {})
    await Promise.allSettled([source.stopTracking(handlePosition), headingService.stop()])
  }

  onBeforeUnmount(stop)

  return {
    phase,
    error,
    isSim,
    joined,
    state,
    accuracy,
    distanceToStartM,
    offRouteM,
    remainingM,
    progressM,
    displayPosition,
    approachLine,
    cameraHeading,
    userHeading,
    compassUnreliable,
    elapsedSeconds,
    etaSeconds,
    start,
    stop,
    begin,
    restart,
    startRadiusM: START_RADIUS_M,
    startAccuracyM: MAX_START_ACCURACY_M,
  }
}
