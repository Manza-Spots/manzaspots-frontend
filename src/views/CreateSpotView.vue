<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Icon from '@/shared/components/Icon.vue'
import IconButton from '@/shared/components/IconButton.vue'
import InputComponent from '@/shared/components/InputComponent.vue'
import Textarea from '@/shared/components/Textarea.vue'
import ButtonComponent from '@/shared/components/ButtonComponent.vue'
import LocationPickerMap from '@/features/map/components/LocationPickerMap.vue'
import { spotsApi } from '@/features/spots/api/spotsApi'
import { findNearbySpots, NEARBY_SPOT_RADIUS_M } from '@/features/spots/utils/nearbySpots'
import {
  saveRecordedRoute,
  getRouteDraft,
  clearRouteDraft,
} from '@/features/routes/services/saveRecordedRoute'
import {
  getUnsavedTrack,
  getPendingPhotos,
  markLastTrackSaved,
} from '@/features/tracking/composables/useRouteRecorder'
import { locationService } from '@/features/tracking/services/locationService'
import { toPoint } from '@/features/tracking/utils/geo'
import { compressImage, pickImage } from '@/shared/utils/image'
import { useNavVisibility } from '@/shared/composables/useNavVisibility'
import { useToast } from '@/shared/composables/useToast'

defineOptions({ name: 'CreateSpotView' })

const NAME_MAX = 50
// Espera a que el pin se quede quieto antes de buscar spots cercanos.
const NEARBY_CHECK_DELAY_MS = 500

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const toast = useToast()
const { isNavHidden } = useNavVisibility()

const mapRef = ref(null)
const form = reactive({ name: '', description: '' })
const errors = reactive({ name: '', description: '', photo: '' })
const photo = ref(null) // { file, url }
const location = ref(initialLocation())
const locating = ref(false)
const submitting = ref(false)

isNavHidden.value = true

// Llegando desde "Guardar ruta" sin spots cerca: el spot nuevo se envía junto
// con la ruta grabada. Sin ruta pendiente (p. ej. la app se reinició) es un
// spot normal.
const pendingRoute = ref(null) // { track, draft }
const fromRoute = computed(() => !!pendingRoute.value)

// Un spot por lugar: con otro a menos de NEARBY_SPOT_RADIUS_M del pin no se
// propone uno nuevo, se usa el existente.
const nearbySpots = ref([])
const checkingNearby = ref(false)
const assigning = ref(false)
const nearbyRadius = `${NEARBY_SPOT_RADIUS_M} m`
let nearbyTimer = null
let nearbyRequest = 0

async function checkNearby(point) {
  const request = ++nearbyRequest
  checkingNearby.value = true
  try {
    const spots = await findNearbySpots(point)
    if (request === nearbyRequest) nearbySpots.value = spots
  } catch (error) {
    // Sin respuesta no se bloquea la propuesta: la revisión la filtra igual.
    console.warn('No se pudieron buscar spots cercanos', error)
    if (request === nearbyRequest) nearbySpots.value = []
  } finally {
    if (request === nearbyRequest) checkingNearby.value = false
  }
}

watch(location, (point) => {
  clearTimeout(nearbyTimer)
  if (!point) return
  nearbyTimer = setTimeout(() => checkNearby(point), NEARBY_CHECK_DELAY_MS)
})

const canSubmit = computed(
  () => !!location.value && !checkingNearby.value && !nearbySpots.value.length,
)

async function loadPendingRoute() {
  if (route.query.fromRoute == null) return
  const [track, draft] = [await getUnsavedTrack(), getRouteDraft()]
  if (track && draft) pendingRoute.value = { track, draft }
}

// Guarda la ruta pendiente en un spot (existente o el recién creado).
async function saveRouteTo(spotId) {
  const { track, draft } = pendingRoute.value
  const { failedPhotos } = await saveRecordedRoute(spotId, {
    track,
    photos: getPendingPhotos(),
    ...draft,
  })
  await markLastTrackSaved()
  clearRouteDraft()
  if (failedPhotos) toast.warning(t('record.save.photosFailed', { count: failedPhotos }))
  return failedPhotos
}

async function useNearbySpot(spot) {
  if (!fromRoute.value) {
    if (!spot.isPending) router.push({ name: 'SpotDetail', params: { id: spot.id } })
    return
  }
  if (assigning.value) return
  assigning.value = true
  try {
    const failedPhotos = await saveRouteTo(spot.id)
    if (!failedPhotos) toast.success(t('record.save.saved'))
    // Un spot en revisión aún no tiene detalle público: su ruta se ve en Perfil.
    router.replace(spot.isPending ? { name: 'Profile' } : { name: 'SpotDetail', params: { id: spot.id } })
  } catch (error) {
    toast.error(error.message || t('common.errors.generic'))
  } finally {
    assigning.value = false
  }
}

/** Ubicación sugerida por query (?lat&lng), p. ej. el final de una ruta grabada. */
function initialLocation() {
  const lat = Number(route.query.lat)
  const lng = Number(route.query.lng)
  return Number.isFinite(lat) && Number.isFinite(lng) && route.query.lat ? { lat, lng } : null
}

async function useMyLocation() {
  if (locating.value) return
  locating.value = true
  try {
    const pos = await locationService.getCurrentPosition()
    // Se fija también aquí: el mapa emite su centro al terminar de moverse,
    // pero sin tiles (conexión lenta) podría no hacerlo nunca.
    location.value = { lat: pos.latitude, lng: pos.longitude }
    mapRef.value?.flyTo(location.value)
  } catch (error) {
    console.warn('No se pudo obtener la ubicación', error)
  } finally {
    locating.value = false
  }
}

let pickingPhoto = false

async function choosePhoto() {
  if (pickingPhoto) return
  pickingPhoto = true
  try {
    const file = await pickImage()
    if (!file) return
    const compressed = await compressImage(file)
    if (photo.value) URL.revokeObjectURL(photo.value.url)
    photo.value = { file: compressed, url: URL.createObjectURL(compressed) }
    errors.photo = ''
  } finally {
    pickingPhoto = false
  }
}

function validate() {
  const name = form.name.trim()
  errors.name = !name
    ? t('common.errors.required')
    : name.length > NAME_MAX
      ? t('common.errors.maxLength', { count: NAME_MAX })
      : ''
  errors.description = form.description.trim() ? '' : t('common.errors.required')
  errors.photo = photo.value ? '' : t('spots.create.photoRequired')
  return !errors.name && !errors.description && !errors.photo && canSubmit.value
}

async function submit() {
  if (submitting.value || !validate()) return
  submitting.value = true
  try {
    const spot = await spotsApi.createSpot({
      name: form.name.trim(),
      description: form.description.trim(),
      file: photo.value.file,
      location: toPoint(location.value),
    })

    if (fromRoute.value) {
      try {
        const failedPhotos = await saveRouteTo(spot.id)
        if (!failedPhotos) toast.success(t('spots.create.submittedWithRoute'))
      } catch (error) {
        // El spot ya existe: la ruta queda pendiente en Grabar y ahí lo
        // ofrecerá como "en revisión" para reintentar.
        console.warn('Spot creado pero la ruta no se pudo guardar', error)
        toast.warning(t('spots.create.routeFailed'))
        router.replace({ name: 'RecordRoute' })
        return
      }
    } else {
      toast.success(t('spots.create.submitted'))
    }
    router.replace({ name: 'Profile' })
  } catch (error) {
    const fields = error.fieldErrors || {}
    errors.name = fields.name || ''
    errors.description = fields.description || ''
    errors.photo = fields.spot_thumbnail_path || ''
    if (!Object.keys(fields).length) toast.error(error.message || t('common.errors.generic'))
  } finally {
    submitting.value = false
  }
}

const goBack = () => {
  if (window.history.state?.back) router.back()
  else router.replace({ name: 'Spots' })
}

onMounted(() => {
  loadPendingRoute()
  if (location.value) checkNearby(location.value)
  else useMyLocation()
})

onUnmounted(() => {
  clearTimeout(nearbyTimer)
  isNavHidden.value = false
  if (photo.value) URL.revokeObjectURL(photo.value.url)
})
</script>

<template>
  <div class="create-spot">
    <header class="create-header">
      <IconButton :label="t('common.buttons.back')" @click="goBack">
        <Icon name="ChevronLeft" :size="24" />
      </IconButton>
      <h1 class="create-title">{{ t('spots.create.title') }}</h1>
    </header>

    <form class="create-form" @submit.prevent="submit">
      <button
        type="button"
        class="photo-picker"
        :class="{ 'has-photo': photo, 'has-error': errors.photo }"
        @click="choosePhoto"
      >
        <img v-if="photo" :src="photo.url" :alt="t('spots.create.photo')" />
        <span class="photo-cta">
          <Icon name="Camera" :size="photo ? 18 : 28" />
          {{ photo ? t('spots.create.changePhoto') : t('spots.create.addPhoto') }}
        </span>
      </button>
      <p v-if="errors.photo" class="field-error">{{ errors.photo }}</p>

      <InputComponent
        v-model="form.name"
        :label="t('spots.create.name')"
        :placeholder="t('spots.create.namePlaceholder')"
        :error="errors.name"
        icon="MapPin"
      />

      <Textarea
        v-model="form.description"
        :label="t('spots.create.description')"
        :placeholder="t('spots.create.descriptionPlaceholder')"
        :error="errors.description"
        :rows="4"
      />

      <section class="location">
        <div class="location-head">
          <span class="location-label">{{ t('spots.create.location') }}</span>
          <button type="button" class="location-locate" :disabled="locating" @click="useMyLocation">
            <Icon name="LocateFixed" :size="14" />
            {{ t('spots.create.useMyLocation') }}
          </button>
        </div>
        <div class="location-map">
          <LocationPickerMap ref="mapRef" v-model="location" />
        </div>
        <p class="location-hint">{{ t('spots.create.locationHint') }}</p>
      </section>

      <section v-if="nearbySpots.length" class="nearby">
        <p class="nearby-title">
          <Icon name="AlertCircle" :size="16" />
          {{ t('spots.create.nearby.title', { radius: nearbyRadius }) }}
        </p>
        <p class="nearby-hint">
          {{ fromRoute ? t('spots.create.nearby.hintRoute') : t('spots.create.nearby.hint') }}
        </p>
        <button
          v-for="spot in nearbySpots"
          :key="spot.id"
          type="button"
          class="nearby-spot"
          :disabled="assigning || (!fromRoute && spot.isPending)"
          @click="useNearbySpot(spot)"
        >
          <img v-if="spot.imageUrl" :src="spot.imageUrl" alt="" class="nearby-thumb" />
          <span class="nearby-name">{{ spot.name }}</span>
          <span v-if="spot.isPending" class="nearby-pending">{{ t('record.save.pending') }}</span>
          <span class="nearby-distance">{{ spot.distance }}</span>
          <Icon v-if="fromRoute || !spot.isPending" name="ChevronRight" :size="16" />
        </button>
      </section>

      <p v-if="fromRoute" class="review-note">
        <Icon name="Route" :size="14" />
        {{ t('spots.create.withRouteNote') }}
      </p>
      <p class="review-note">
        <Icon name="Info" :size="14" />
        {{ t('spots.create.reviewNote') }}
      </p>

      <ButtonComponent
        type="submit"
        variant="primary"
        size="lg"
        full-width
        :loading="submitting"
        :disabled="!canSubmit"
      >
        {{ t('spots.create.submit') }}
      </ButtonComponent>
    </form>
  </div>
</template>

<style scoped>
.create-spot {
  min-height: 100vh;
  background: var(--color-bg);
  padding-bottom: calc(var(--space-8) + var(--safe-area-inset-bottom));
}

.create-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: calc(var(--safe-area-inset-top) + var(--space-3)) var(--space-4) var(--space-3);
  background: var(--color-bg);
}

.create-title {
  margin: 0;
  font-size: var(--text-xl);
  font-weight: var(--font-extrabold);
  letter-spacing: -0.02em;
  color: var(--color-text-primary);
}

.create-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: 0 var(--space-4);
  max-width: 560px;
  margin: 0 auto;
}

.photo-picker {
  position: relative;
  height: 190px;
  border-radius: var(--radius-xl);
  border: 1.5px dashed var(--color-border-hover);
  background: var(--color-surface-2);
  color: var(--color-text-secondary);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: filter var(--transition-fast);
}

.photo-picker:active {
  filter: brightness(0.96);
}

.photo-picker.has-photo {
  border-style: solid;
  border-color: var(--color-border);
}

.photo-picker.has-error {
  border-color: var(--color-coral);
}

.photo-picker img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-cta {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
}

.has-photo .photo-cta {
  flex-direction: row;
  position: absolute;
  right: var(--space-3);
  bottom: var(--space-3);
  padding: 6px 12px;
  border-radius: var(--radius-full);
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: var(--text-xs);
}

.field-error {
  margin: calc(var(--space-2) * -1) 0 0;
  font-size: var(--text-xs);
  color: var(--color-coral);
}

.location {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.location-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.location-label {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

.location-locate {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: var(--radius-full);
  background: var(--color-primary-tint);
  color: var(--color-primary);
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  transition: var(--press-transition);
}

.location-locate:active {
  transform: scale(var(--press-scale));
}

.location-map {
  height: 230px;
  border-radius: var(--radius-xl);
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.location-hint {
  margin: 0;
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

/* Spots existentes a menos del radio: misma tarjeta que en "Guardar ruta". */
.nearby {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  border-radius: var(--radius-lg);
  background: var(--color-sand-tint);
}

.nearby-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin: 0;
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
  color: var(--color-arena-deep);
}

.nearby-hint {
  margin: 0;
  font-size: var(--text-xs);
  line-height: var(--leading-normal);
  color: var(--color-text-secondary);
}

.nearby-spot {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2);
  border-radius: var(--radius-lg);
  border: 1.5px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-tertiary);
  text-align: left;
  transition: var(--press-transition);
}

.nearby-spot:active:not(:disabled) {
  transform: scale(var(--press-scale));
}

.nearby-thumb {
  width: 40px;
  height: 40px;
  flex: none;
  border-radius: var(--radius-md);
  object-fit: cover;
}

.nearby-name {
  flex: 1;
  min-width: 0;
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nearby-pending {
  flex: none;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  background: var(--color-sand-tint);
  color: var(--color-arena-deep);
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
}

.nearby-distance {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
}

.review-note {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  margin: 0;
  font-size: var(--text-xs);
  line-height: var(--leading-normal);
  color: var(--color-text-secondary);
}
</style>
