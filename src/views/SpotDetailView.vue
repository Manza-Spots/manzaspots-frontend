<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Icon from '@/shared/components/Icon.vue'
import DetentSheet from '@/shared/components/DetentSheet.vue'
import SpotDetailHeader from '@/features/spots/components/SpotDetailHeader.vue'
import SpotRouteActionBar from '@/features/spots/components/SpotRouteActionBar.vue'
import SegmentedControl from '@/shared/components/SegmentedControl.vue'
import SpotGallery from '@/features/spots/components/SpotGallery.vue'
import RouteCard from '@/features/spots/components/RouteCard.vue'
import SpotLocationMap from '@/features/map/components/SpotLocationMap.vue'
import { useSpotDetail } from '@/features/spots/composables/useSpotDetail'
import { useFavoriteSync } from '@/features/spots/composables/useFavoriteSync'
import { useNavVisibility } from '@/shared/composables/useNavVisibility'
import { useToast } from '@/shared/composables/useToast'
import { useRefreshable } from '@/shared/composables/useRefreshable'

defineOptions({ name: 'SpotDetailView' })

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const toast = useToast()

const { spot, routes, loading, error, load, toggleFavorite } = useSpotDetail()
const { isNavHidden } = useNavVisibility()
const { markFavorite } = useFavoriteSync()

const savingFavorite = ref(false)

const DETENTS = ['header', 0.6, 0.89]
const FULL = 2
const detent = ref(0)

const isFull = computed(() => detent.value === FULL)
const tab = ref('routes')
const sheetHeight = ref(0)
const selectedRouteId = ref(null)

const spotId = computed(() => route.params.id)

isNavHidden.value = true

watch(routes, (list) => {
  if (list.length && selectedRouteId.value == null) selectedRouteId.value = list[0].id
})

const selectRoute = (id) => {
  selectedRouteId.value = id
}

const headerRef = ref(null)
const topInset = ref(0)
let headerObserver = null

const MAP_STRIP = 72

const measureHeader = () => {
  const el = headerRef.value?.$el
  topInset.value = el ? el.offsetHeight + MAP_STRIP : 0
}

const tabOptions = computed(() => [
  { value: 'routes', label: `${t('spots.detail.tabRoutes')} (${routes.value.length})` },
  { value: 'gallery', label: `${t('spots.detail.tabGallery')} (${spot.value?.gallery.length ?? 0})` },
])

const selectedRouteName = computed(() => {
  const route = routes.value.find((r) => r.id === selectedRouteId.value)
  return route ? route.description || t('profile.routeUnnamed') : ''
})

const goBack = () => {
  if (window.history.state?.back) router.back()
  else router.push({ name: 'Spots' })
}

const onToggleFavorite = async () => {
  if (savingFavorite.value) return
  savingFavorite.value = true
  const ok = await toggleFavorite()
  savingFavorite.value = false

  markFavorite(spot.value.id, spot.value.isFavorite)
  if (!ok) toast.error(t('common.errors.generic'))
}

onMounted(() => load(spotId.value))

watch(spot, async () => {
  if (!spot.value) return
  await nextTick()
  measureHeader()
  const el = headerRef.value?.$el
  if (el && !headerObserver) {
    headerObserver = new ResizeObserver(measureHeader)
    headerObserver.observe(el)
  }
})

onUnmounted(() => {
  isNavHidden.value = false
  headerObserver?.disconnect()
})

useRefreshable(() => load(spotId.value))
</script>

<template>
  <div class="spot-detail">
    <div v-if="loading && !spot" class="detail-state">
      <Icon name="MapPinned" :size="34" />
      <p>{{ t('common.buttons.loading') }}</p>
    </div>

    <div v-else-if="error || !spot" class="detail-state">
      <Icon name="AlertCircle" :size="34" />
      <p>{{ t('spots.detail.notFound') }}</p>
      <button type="button" class="detail-back" @click="goBack">
        {{ t('common.buttons.back') }}
      </button>
    </div>

    <template v-else>
      <SpotLocationMap
        class="detail-map"
        :location="spot.location"
        :routes="routes"
        :selected-id="selectedRouteId"
        :bottom-padding="sheetHeight"
        :is-favorite="spot.isFavorite"
      />

      <SpotDetailHeader
        ref="headerRef"
        :is-favorite="spot.isFavorite"
        @back="goBack"
        @toggle-favorite="onToggleFavorite"
      />

      <DetentSheet
        v-model="detent"
        :detents="DETENTS"
        :top-inset="topInset"
        @height="sheetHeight = $event"
      >

        <template #header>
          <div class="sheet-head">
            <h1 class="sheet-name">{{ spot.name }}</h1>
            <div class="sheet-meta">
              <span v-if="spot.distance" class="meta-chip">
                <Icon name="MapPin" :size="13" />
                {{ spot.distance }}
              </span>
              <span class="meta-routes">
                {{ t('spots.detail.routeCount', { count: routes.length }) }}
              </span>
            </div>
          </div>
        </template>

        <template #subheader>
          <SegmentedControl
            v-if="isFull"
            v-model="tab"
            class="sheet-tabs"
            :options="tabOptions"
            size="sm"
          />
          <p v-else-if="spot.description" class="sheet-description">{{ spot.description }}</p>
        </template>

        <div class="sheet-body">
          <SpotGallery v-if="!isFull || tab === 'gallery'" :photos="spot.gallery" />
          <section v-if="!isFull || tab === 'routes'" class="routes">
            <header v-if="!isFull" class="routes-head">
              <span class="routes-title">{{ t('spots.detail.routes') }}</span>
            </header>

            <RouteCard
              v-for="r in routes"
              :key="r.id"
              :route="r"
              selectable
              :selected="r.id === selectedRouteId"
              @click="selectRoute(r.id)"
            />

            <div v-if="!routes.length" class="routes-empty">
              <Icon name="Route" :size="26" />
              <p>{{ t('spots.detail.routesEmpty') }}</p>
            </div>
          </section>
        </div>

        <template #footer>
          <SpotRouteActionBar :route-name="selectedRouteName" />
        </template>
      </DetentSheet>
    </template>
  </div>
</template>

<style scoped>
.spot-detail {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: var(--color-bg);
}

.detail-map {
  position: absolute;
  inset: 0;
}

.sheet-head {
  padding: var(--space-3) var(--space-5) var(--space-4);
}

.sheet-name {
  margin: 0;
  font-size: var(--text-2xl);
  font-weight: var(--font-extrabold);
  letter-spacing: -0.02em;
  line-height: 1.15;
  color: var(--color-text-primary);
}

.sheet-meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  background: var(--color-primary-tint);
  color: var(--color-primary);
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
}

.meta-routes {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--color-text-tertiary);
}

.sheet-body {
  padding: 0 var(--space-5) var(--space-8);
}

.sheet-tabs {
  margin: 0 var(--space-5) var(--space-3);
}

.sheet-description {
  margin: 0;
  padding: 0 var(--space-5) var(--space-2);
  font-size: var(--text-base);
  line-height: var(--leading-normal);
  color: var(--color-text-secondary);
}

.routes {
  margin-top: var(--space-6);
}

.routes-head {
  margin-bottom: var(--space-3);
}

.routes-title {
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-tertiary);
}

.routes-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-6) 0;
  border-radius: var(--radius-xl);
  background: var(--color-surface-2);
  color: var(--color-text-tertiary);
  text-align: center;
}

.routes-empty p {
  margin: 0;
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
}

.detail-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  min-height: 100vh;
  color: var(--color-text-tertiary);
}

.detail-state p {
  margin: 0;
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
}

.detail-back {
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-full);
  background: var(--color-primary);
  color: var(--color-on-primary);
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
  transition: var(--press-transition);
}

.detail-back:active {
  transform: scale(var(--press-scale));
}
</style>
