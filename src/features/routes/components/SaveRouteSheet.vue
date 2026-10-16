<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Icon from '@/shared/components/Icon.vue'
import ButtonComponent from '@/shared/components/ButtonComponent.vue'
import SegmentedControl from '@/shared/components/SegmentedControl.vue'
import Textarea from '@/shared/components/Textarea.vue'
import { useAuth } from '@/features/auth/composables/useAuth'
import { useBottomSheet } from '@/shared/composables/useBottomSheet'
import { useToast } from '@/shared/composables/useToast'
import { routesApi } from '@/features/routes/api/routesApi'
import { spotsApi } from '@/features/spots/api/spotsApi'
import { mapSpot } from '@/features/spots/utils/spotMapper'
import { toLineString, toPoint } from '@/features/tracking/utils/geo'

const props = defineProps({
  // Ruta finalizada: { points, distanceKm, durationSeconds }
  track: {
    type: Object,
    required: true,
  },
  // Fotos del recorrido: [{ file, url, location: { lat, lng } }]
  photos: {
    type: Array,
    default: () => [],
  },
  // Spot de destino preseleccionado (al grabar desde el detalle de un spot).
  spotId: {
    type: [Number, String],
    default: null,
  },
  onSaved: {
    type: Function,
    default: () => {},
  },
})

// Radio (km) alrededor del final de la ruta para sugerir spots de destino.
const NEARBY_RADIUS_KM = 10

const router = useRouter()
const { t } = useI18n()
const toast = useToast()
const bottomSheet = useBottomSheet()
const { isAuthenticated } = useAuth()

const difficulties = ref([])
const travelModes = ref([])
const spots = ref([])
const loadingSpots = ref(false)
const catalogsError = ref(false)

const selectedSpotId = ref(props.spotId != null ? Number(props.spotId) : null)
const difficulty = ref('')
const travelMode = ref('')
const description = ref('')
const saving = ref(false)

const endPoint = computed(() => {
  const last = props.track.points?.at(-1)
  return last ? { lat: last.lat, lng: last.lng } : null
})

const duration = computed(() => {
  const total = props.track.durationSeconds ?? 0
  const m = Math.floor(total / 60)
  const s = String(total % 60).padStart(2, '0')
  return `${m}:${s}`
})

const difficultyOptions = computed(() =>
  difficulties.value.map((d) => ({ value: d.key, label: d.name })),
)
const travelModeOptions = computed(() =>
  travelModes.value.map((m) => ({ value: m.key, label: m.name })),
)

const canSave = computed(
  () => !!selectedSpotId.value && !!difficulty.value && !!travelMode.value && !saving.value,
)

async function loadCatalogs() {
  try {
    const [d, m] = await Promise.all([routesApi.getDifficulties(), routesApi.getTravelModes()])
    // El backend los ordena por nombre; por id quedan en el orden de dificultad.
    difficulties.value = [...d].sort((a, b) => a.id - b.id)
    travelModes.value = [...m].sort((a, b) => a.id - b.id)
    difficulty.value ||= difficulties.value[0]?.key ?? ''
    travelMode.value ||= travelModes.value[0]?.key ?? ''
    catalogsError.value = false
  } catch (error) {
    console.warn('No se pudieron cargar los catálogos de rutas', error)
    catalogsError.value = true
  }
}

async function loadSpots() {
  if (!endPoint.value) return
  loadingSpots.value = true
  try {
    const raw = await spotsApi.getSpots({
      lat: endPoint.value.lat,
      lng: endPoint.value.lng,
      radius: NEARBY_RADIUS_KM,
    })
    let list = raw.map((s) => mapSpot(s, endPoint.value))

    // El spot preseleccionado puede quedar fuera del radio: se agrega igual.
    if (selectedSpotId.value && !list.some((s) => s.id === selectedSpotId.value)) {
      try {
        const spot = await spotsApi.getSpot(selectedSpotId.value)
        list = [mapSpot(spot, endPoint.value), ...list]
      } catch {
        selectedSpotId.value = null
      }
    }

    spots.value = list
    selectedSpotId.value ??= list[0]?.id ?? null
  } catch (error) {
    console.warn('No se pudieron cargar los spots cercanos', error)
  } finally {
    loadingSpots.value = false
  }
}

function goLogin() {
  bottomSheet.close()
  router.push({ name: 'Login', query: { redirect: '/record-route' } })
}

function createSpotHere() {
  bottomSheet.close()
  router.push({ name: 'CreateSpot', query: endPoint.value ?? {} })
}

async function save() {
  if (!canSave.value) return

  const path = toLineString(props.track.points)
  if (!path) {
    toast.error(t('record.tooShort'))
    return
  }

  saving.value = true
  const spotId = selectedSpotId.value
  try {
    const route = await routesApi.createRoute(spotId, {
      path,
      difficulty: difficulty.value,
      travel_mode: travelMode.value,
      description: description.value.trim(),
    })

    // Las fotos se suben una a una: una que falle no tumba la ruta ya creada.
    let failed = 0
    for (const photo of props.photos) {
      try {
        await routesApi.uploadRoutePhoto(spotId, route.id, {
          file: photo.file,
          location: toPoint(photo.location),
        })
      } catch (error) {
        console.warn('No se pudo subir una foto de la ruta', error)
        failed += 1
      }
    }

    if (failed) toast.warning(t('record.save.photosFailed', { count: failed }))
    else toast.success(t('record.save.saved'))

    bottomSheet.close()
    props.onSaved(route, spotId)
  } catch (error) {
    toast.error(error.message || t('common.errors.generic'))
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  if (!isAuthenticated.value) return
  loadCatalogs()
  loadSpots()
})
</script>

<template>
  <div class="save-route">
    <div class="summary">
      <div class="summary-item">
        <Icon name="Ruler" :size="14" />
        {{ Number(track.distanceKm ?? 0).toFixed(2) }} km
      </div>
      <div class="summary-item">
        <Icon name="Clock" :size="14" />
        {{ duration }}
      </div>
      <div class="summary-item">
        <Icon name="Camera" :size="14" />
        {{ t('record.save.photos', photos.length) }}
      </div>
    </div>

    <div v-if="photos.length" class="photo-strip">
      <img v-for="(photo, i) in photos" :key="i" :src="photo.url" alt="" />
    </div>

    <template v-if="!isAuthenticated">
      <p class="login-note">{{ t('record.save.loginRequired') }}</p>
      <ButtonComponent variant="primary" full-width @click="goLogin">
        <Icon name="LogIn" :size="18" />
        {{ t('record.save.login') }}
      </ButtonComponent>
    </template>

    <template v-else>
      <section class="field">
        <span class="field-label">{{ t('record.save.spot') }}</span>

        <p v-if="loadingSpots" class="field-hint">{{ t('record.save.spotsLoading') }}</p>

        <div v-else-if="spots.length" class="spot-options">
          <button
            v-for="spot in spots"
            :key="spot.id"
            type="button"
            class="spot-option"
            :class="{ 'is-selected': spot.id === selectedSpotId }"
            @click="selectedSpotId = spot.id"
          >
            <img v-if="spot.imageUrl" :src="spot.imageUrl" alt="" class="spot-thumb" />
            <span class="spot-name">{{ spot.name }}</span>
            <span v-if="spot.distance" class="spot-distance">{{ spot.distance }}</span>
            <Icon v-if="spot.id === selectedSpotId" name="CheckCircle" :size="18" class="spot-check" />
          </button>
        </div>

        <div v-else class="no-spots">
          <p>{{ t('record.save.noSpots') }}</p>
        </div>

        <button type="button" class="create-spot" @click="createSpotHere">
          <Icon name="Plus" :size="14" />
          {{ t('record.save.createSpot') }}
        </button>
      </section>

      <p v-if="catalogsError" class="field-hint field-hint--error">
        {{ t('record.save.catalogsFailed') }}
        <button type="button" class="retry" @click="loadCatalogs">
          {{ t('common.buttons.retry') }}
        </button>
      </p>

      <section v-if="difficultyOptions.length" class="field">
        <span class="field-label">{{ t('record.save.difficulty') }}</span>
        <SegmentedControl v-model="difficulty" :options="difficultyOptions" size="sm" />
      </section>

      <section v-if="travelModeOptions.length" class="field">
        <span class="field-label">{{ t('record.save.travelMode') }}</span>
        <SegmentedControl v-model="travelMode" :options="travelModeOptions" size="sm" />
      </section>

      <Textarea
        v-model="description"
        :label="t('record.save.description')"
        :placeholder="t('record.save.descriptionPlaceholder')"
        :rows="2"
      />

      <ButtonComponent
        variant="primary"
        size="lg"
        full-width
        :loading="saving"
        :disabled="!canSave"
        @click="save"
      >
        <Icon name="Save" :size="18" />
        {{ t('record.save.submit') }}
      </ButtonComponent>
    </template>
  </div>
</template>

<style scoped>
.save-route {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding-bottom: var(--space-4);
}

.summary {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.summary-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: var(--radius-full);
  background: var(--color-primary-tint);
  color: var(--color-primary);
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  font-variant-numeric: tabular-nums;
}

.photo-strip {
  display: flex;
  gap: var(--space-2);
  overflow-x: auto;
}

.photo-strip img {
  width: 64px;
  height: 64px;
  flex: none;
  border-radius: var(--radius-lg);
  object-fit: cover;
}

.login-note {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.field-label {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

.field-hint {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
}

.field-hint--error {
  color: var(--color-coral);
}

.retry {
  margin-left: var(--space-2);
  font-weight: var(--font-bold);
  color: var(--color-primary);
  text-decoration: underline;
}

.spot-options {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  max-height: 220px;
  overflow-y: auto;
}

.spot-option {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2);
  border-radius: var(--radius-lg);
  border: 1.5px solid var(--color-border);
  background: var(--color-surface);
  text-align: left;
  transition: border-color var(--transition-fast);
}

.spot-option.is-selected {
  border-color: var(--color-primary);
}

.spot-thumb {
  width: 40px;
  height: 40px;
  flex: none;
  border-radius: var(--radius-md);
  object-fit: cover;
}

.spot-name {
  flex: 1;
  min-width: 0;
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.spot-distance {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--color-text-tertiary);
}

.spot-check {
  color: var(--color-primary);
  flex: none;
}

.no-spots p {
  margin: 0;
  padding: var(--space-3);
  border-radius: var(--radius-lg);
  background: var(--color-surface-2);
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
  text-align: center;
}

.create-spot {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  color: var(--color-primary);
}
</style>
