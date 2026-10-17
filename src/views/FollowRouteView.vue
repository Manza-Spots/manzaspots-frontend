<script setup>
import { ref, shallowRef, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Icon from '@/shared/components/Icon.vue'
import ButtonComponent from '@/shared/components/ButtonComponent.vue'
import IconButton from '@/shared/components/IconButton.vue'
import FollowMap from '@/features/map/components/FollowMap.vue'
import RestartRouteSheet from '@/features/routes/components/RestartRouteSheet.vue'
import { spotsApi } from '@/features/spots/api/spotsApi'
import { createRouteGuide } from '@/features/tracking/utils/routeGuide'
import { useRouteFollower } from '@/features/tracking/composables/useRouteFollower'
import { gpsSimulator } from '@/features/tracking/services/gpsSimulator'
import { useBottomSheet } from '@/shared/composables/useBottomSheet'
import { useToast } from '@/shared/composables/useToast'
import { getOfflineRoute } from '@/features/offline/services/offlineRoutes'
import { isOffline } from '@/core/network/connectivity'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const bottomSheet = useBottomSheet()
const toast = useToast()

const spotId = route.query.spot ?? null
const routeId = route.query.route ?? null

const loading = ref(true)
const loadFailed = ref(false)
// Ruta tal como llega de la API (path, description, travel_mode...).
const followed = shallowRef(null)
const guide = shallowRef(null)
const travelMode = computed(() => followed.value?.travel_mode ?? 'walk')
const mode = ref('nav') // nav | overview

// Lo que tapan el cartel y el panel, para que la flecha no quede debajo.
const topRef = ref(null)
const sheetRef = ref(null)
const insets = ref({ top: 0, bottom: 0 })
let insetsObserver = null
const measureInsets = () => {
  insets.value = {
    top: topRef.value?.getBoundingClientRect().bottom ?? 0,
    bottom: sheetRef.value?.offsetHeight ?? 0,
  }
}
watch(sheetRef, (sheet) => {
  insetsObserver?.disconnect()
  if (!sheet) return
  insetsObserver = new ResizeObserver(measureInsets)
  insetsObserver.observe(sheet)
  insetsObserver.observe(topRef.value)
  measureInsets()
})

const {
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
  startRadiusM,
  startAccuracyM,
} = useRouteFollower(guide, travelMode)

const routeName = computed(() => followed.value?.description || t('profile.routeUnnamed'))
const progress = computed(() => (guide.value ? progressM.value / guide.value.totalM : 0))

const formatDistance = (meters) => {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`
  if (meters >= 100) return `${Math.round(meters / 10) * 10} m`
  return `${Math.max(Math.round(meters / 5) * 5, 0)} m`
}

const formatDuration = (seconds) => {
  // Hacia arriba: si falta algo, nunca dice 0 min.
  const minutes = Math.ceil(seconds / 60)
  if (minutes < 60) return `${minutes} min`
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')} min`
}

// Reloj para recalcular la hora de llegada aunque el GPS no mande lecturas.
const now = ref(Date.now())
const clock = setInterval(() => {
  now.value = Date.now()
}, 15000)

const arrivalClock = computed(() => {
  if (etaSeconds.value == null) return '--:--'
  return new Intl.DateTimeFormat(locale.value, { hour: 'numeric', minute: '2-digit' }).format(
    now.value + etaSeconds.value * 1000,
  )
})

const maneuverIcon = ({ type, side }) => {
  if (type === 'uturn') return side === 'left' ? 'Undo2' : 'Redo2'
  if (type === 'slight') return side === 'left' ? 'ArrowUpLeft' : 'ArrowUpRight'
  return side === 'left' ? 'CornerUpLeft' : 'CornerUpRight'
}

const maneuverText = ({ type, side }) =>
  type === 'uturn' ? t('follow.maneuver.uturn') : t(`follow.maneuver.${type}.${side}`)

// Cartel superior, al estilo de la indicación de Waze.
const banner = computed(() => {
  if (error.value === 'location') {
    return { kind: 'off', icon: 'AlertCircle', title: t('follow.locationDenied') }
  }
  if (phase.value === 'locating') {
    return { kind: 'waiting', icon: 'LocateFixed', title: t('follow.waitingGps') }
  }
  if (phase.value === 'approaching') {
    const lowAccuracy = accuracy.value != null && accuracy.value > startAccuracyM
    return {
      kind: 'approach',
      icon: 'Navigation',
      distance: formatDistance(distanceToStartM.value ?? 0),
      title: t('follow.approach.title'),
      subtitle: lowAccuracy
        ? t('follow.approach.lowAccuracy', { accuracy: formatDistance(accuracy.value) })
        : t('follow.approach.subtitle', { radius: formatDistance(startRadiusM) }),
    }
  }
  if (phase.value === 'ready') {
    return {
      kind: 'ready',
      icon: 'Flag',
      title: t('follow.ready.title'),
      subtitle: t('follow.ready.subtitle'),
    }
  }
  if (phase.value === 'arrived') {
    return {
      kind: 'arrived',
      icon: 'Flag',
      title: t('follow.arrived'),
      subtitle: t('follow.arrivedSummary', { time: formatDuration(elapsedSeconds.value) }),
    }
  }
  if (phase.value === 'offRoute') {
    return {
      kind: 'off',
      icon: 'AlertCircle',
      title: t('follow.offRoute'),
      subtitle: t('follow.offRouteLocked'),
    }
  }
  if (!joined.value) {
    return {
      kind: 'approach',
      icon: 'Navigation',
      distance: formatDistance(offRouteM.value),
      title: t('follow.join.title'),
    }
  }
  const s = state.value
  if (s.offRoute) {
    return {
      kind: 'off',
      icon: 'AlertCircle',
      title: t('follow.offRoute'),
      subtitle: t('follow.offRouteGrace', { distance: formatDistance(s.offRouteM) }),
    }
  }
  const next = s.nextManeuver
  if (!next) {
    return { kind: 'nav', icon: 'ArrowUp', distance: formatDistance(s.remainingM), title: t('follow.toFinish') }
  }
  return {
    kind: 'nav',
    icon: maneuverIcon(next),
    distance: formatDistance(next.distanceM),
    title: maneuverText(next),
  }
})

const toggleMode = () => {
  mode.value = mode.value === 'nav' ? 'overview' : 'nav'
}

const goBack = () => {
  if (window.history.state?.back) router.back()
  else router.push({ name: 'SpotDetail', params: { id: spotId }, query: { route: routeId } })
}

const finish = async () => {
  await stop()
  goBack()
}

// Antes de tocar Iniciar el botón principal es Iniciar (deshabilitado lejos del
// inicio); después, Terminar.
const notStarted = computed(() => ['locating', 'approaching', 'ready'].includes(phase.value))

const onBegin = () => {
  if (begin()) toast.success(t('follow.started'))
}

// Salirse no deja volver a entrar en otro punto: se reinicia o se termina.
watch(phase, (current) => {
  if (current !== 'offRoute') return
  bottomSheet.open(
    RestartRouteSheet,
    { onRestart: restart, onFinish: finish },
    { title: t('follow.restart.title'), closable: false, closeOnBackdrop: false },
  )
})

// Con la ruta descargada no se espera a una API que no contesta (señal débil).
const API_TIMEOUT_MS = 6000

// La ruta de la API; si no responde, la descargada para usar sin señal.
async function findRoute() {
  const saved = await getOfflineRoute(spotId, routeId)
  // Sin conexión ni se intenta: el aviso de error de la API sobraría.
  if (saved && isOffline()) return saved.route
  try {
    const request = spotsApi.getSpotRoutes(spotId)
    const timeout = new Promise((resolve) => setTimeout(resolve, API_TIMEOUT_MS, null))
    const routes = await (saved ? Promise.race([request, timeout]) : request)
    if (!routes) {
      request.catch(() => {})
      throw new Error('La API no respondió a tiempo')
    }
    const found = routes.find((r) => String(r.id) === String(routeId))
    if (found?.path?.coordinates || !saved) return found
  } catch (err) {
    if (!saved) throw err
    console.warn('Sin respuesta de la API; se usa la ruta descargada', err)
  }
  toast.info(t('offline.usingSaved'))
  return saved.route
}

async function load() {
  try {
    const found = await findRoute()
    const ready = found?.path?.coordinates ? createRouteGuide(found.path.coordinates) : null
    if (!ready) throw new Error('La ruta no tiene trazo')

    followed.value = found
    guide.value = ready
    if (isSim) gpsSimulator.setPath(found.path.coordinates)
    loading.value = false
    start()
  } catch (err) {
    console.warn('No se pudo cargar la ruta a seguir', err)
    loading.value = false
    loadFailed.value = true
  }
}

onMounted(load)
onUnmounted(() => {
  clearInterval(clock)
  if (phase.value === 'offRoute') bottomSheet.close()
  insetsObserver?.disconnect()
  if (isSim) gpsSimulator.setPath(null)
})
</script>

<template>
  <div class="follow-view">
    <div v-if="loading || loadFailed" class="follow-empty">
      <p>{{ loading ? t('follow.loading') : t('follow.loadFailed') }}</p>
      <ButtonComponent v-if="loadFailed" variant="secondary" @click="goBack">
        {{ t('follow.back') }}
      </ButtonComponent>
    </div>

    <template v-else>
      <FollowMap
        :route="followed.path"
        :position="displayPosition"
        :bearing="cameraHeading"
        :user-heading="userHeading"
        :progress="progress"
        :approach="approachLine"
        :mode="mode"
        :insets="insets"
      />

      <div ref="topRef" class="follow-top">
        <div class="follow-banner" :class="`follow-banner--${banner.kind}`">
          <span class="follow-banner__icon" :class="{ 'is-searching': banner.kind === 'waiting' }">
            <Icon :name="banner.icon" :size="34" :stroke-width="2.5" />
          </span>
          <div class="follow-banner__text">
            <div v-if="banner.distance" class="follow-banner__distance">{{ banner.distance }}</div>
            <div class="follow-banner__title">{{ banner.title }}</div>
            <div v-if="banner.subtitle" class="follow-banner__subtitle">{{ banner.subtitle }}</div>
          </div>
        </div>

        <div class="follow-tools">
          <span v-if="isSim" class="follow-chip">SIM</span>
          <button
            class="follow-fab"
            :aria-label="mode === 'nav' ? t('follow.controls.overview') : t('follow.controls.navigate')"
            @click="toggleMode"
          >
            <Icon :name="mode === 'nav' ? 'Map' : 'Navigation2'" :size="22" />
          </button>
        </div>
      </div>

      <div ref="sheetRef" class="follow-sheet">
        <p v-if="compassUnreliable" class="follow-hint">
          <Icon name="Compass" :size="14" />
          {{ t('follow.calibrate') }}
        </p>

        <div class="follow-name">{{ routeName }}</div>
        <div class="follow-progress">
          <span :style="{ width: `${Math.min(progress, 1) * 100}%` }"></span>
        </div>

        <div class="follow-stats">
          <div class="follow-stat">
            <div class="follow-stat__value">{{ formatDistance(remainingM) }}</div>
            <div class="follow-stat__key">{{ t('follow.stats.remaining') }}</div>
          </div>
          <div class="follow-stat">
            <div class="follow-stat__value">
              {{ etaSeconds != null ? formatDuration(etaSeconds) : '--' }}
            </div>
            <div class="follow-stat__key">{{ t('follow.stats.duration') }}</div>
          </div>
          <div class="follow-stat">
            <div class="follow-stat__value">{{ arrivalClock }}</div>
            <div class="follow-stat__key">{{ t('follow.stats.arrival') }}</div>
          </div>
        </div>

        <div v-if="notStarted" class="follow-actions">
          <ButtonComponent
            class="follow-actions__start"
            variant="primary"
            size="lg"
            :disabled="phase !== 'ready'"
            @click="onBegin"
          >
            <Icon name="Navigation" :size="18" />
            {{ t('follow.controls.start') }}
          </ButtonComponent>
          <IconButton :label="t('follow.back')" @click="goBack">
            <Icon name="X" :size="20" />
          </IconButton>
        </div>
        <ButtonComponent
          v-else
          class="follow-finish"
          variant="secondary"
          size="lg"
          full-width
          @click="finish"
        >
          <Icon name="Square" :size="16" />
          {{ t('follow.controls.finish') }}
        </ButtonComponent>
      </div>
    </template>
  </div>
</template>

<style scoped>
.follow-view {
  position: relative;
  height: 100vh;
  background: var(--color-bg);
  overflow: hidden;
}

.follow-empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  color: var(--color-text-secondary);
  font-weight: var(--font-bold);
}

.follow-top {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
  padding: calc(var(--safe-area-inset-top) + var(--space-4)) var(--space-4) 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.follow-banner {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
  border-radius: var(--radius-2xl);
  background: var(--color-selva-deep);
  color: #fff;
  box-shadow: var(--shadow-md);
}

.follow-banner--waiting {
  background: var(--color-surface);
  color: var(--color-text-primary);
}

.follow-banner--approach {
  background: var(--color-mar-deep);
}

.follow-banner--off {
  background: var(--color-coral);
}

.follow-banner--ready,
.follow-banner--arrived {
  background: var(--color-primary);
  color: var(--color-on-primary);
}

.follow-banner__icon {
  position: relative;
  display: flex;
  flex-shrink: 0;
}

/* Buscando ubicación: el mismo halo que late bajo la posición en los mapas. */
.follow-banner__icon.is-searching::after {
  content: '';
  position: absolute;
  inset: -10px;
  border-radius: 50%;
  background: var(--color-primary);
  opacity: 0.4;
  animation: pulse-ring 2s infinite ease-out;
  pointer-events: none;
}

.follow-banner__text {
  min-width: 0;
}

.follow-banner__distance {
  font-size: var(--text-3xl);
  font-weight: var(--font-extrabold);
  letter-spacing: -0.03em;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

.follow-banner__title {
  font-size: 17px;
  font-weight: var(--font-bold);
  line-height: 1.25;
}

.follow-banner__subtitle {
  font-size: 13px;
  font-weight: var(--font-bold);
  opacity: 0.85;
  margin-top: 2px;
}

.follow-tools {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-2);
}

.follow-chip {
  margin-right: auto;
  background: var(--color-primary);
  color: var(--color-on-primary);
  font-size: 13px;
  font-weight: var(--font-extrabold);
  letter-spacing: 0.04em;
  padding: 8px 14px;
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-md);
}

.follow-fab {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: var(--glass-bg);
  -webkit-backdrop-filter: var(--blur);
  backdrop-filter: var(--blur);
  border: 1px solid var(--hairline);
  box-shadow: var(--shadow-md);
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--press-transition);
}

.follow-fab:active {
  transform: scale(var(--press-scale-strong));
}

/* Sheet inferior con lo que falta y el botón de terminar */
.follow-sheet {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 30;
  background: var(--color-surface);
  border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
  box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.1);
  padding: var(--space-5) var(--space-6) var(--bottom-bar-padding);
}

.follow-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 var(--space-3);
  font-size: 12px;
  font-weight: var(--font-bold);
  color: var(--color-arena-deep);
}

.follow-name {
  font-size: 15px;
  font-weight: var(--font-extrabold);
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.follow-progress {
  height: 6px;
  border-radius: var(--radius-full);
  background: var(--color-bg-tertiary);
  margin: var(--space-3) 0 var(--space-2);
  overflow: hidden;
}

.follow-progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--color-primary);
  transition: width 1s linear;
}

.follow-stats {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--space-2);
  padding: var(--space-3) 0 var(--space-4);
}

.follow-stat {
  text-align: center;
}

/* Igual que la barra de acción del detalle del spot (SpotRouteActionBar):
   botón en píldora y botón de icono del mismo alto. */
.follow-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.follow-actions__start {
  flex: 1;
  min-width: 0;
  border-radius: var(--radius-full);
}

.follow-actions :deep(.icon-btn) {
  width: 56px;
  height: 56px;
  flex: none;
}

.follow-finish {
  border-radius: var(--radius-full);
}

.follow-stat__value {
  font-size: var(--text-xl);
  font-weight: var(--font-extrabold);
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}

.follow-stat__key {
  font-size: 11px;
  font-weight: var(--font-bold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-tertiary);
  margin-top: 2px;
}
</style>
