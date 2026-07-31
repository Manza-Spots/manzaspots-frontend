<script setup>
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import InteractiveMap from '@/features/map/components/InteractiveMap.vue'
import ImmersiveSpotList from '@/features/spots/components/ImmersiveSpotList.vue'
import SpotSearchResults from '@/features/spots/components/SpotSearchResults.vue'
import SpotFiltersBottomSheet from '@/features/spots/components/FiltersMenu.vue'
import SpotsHeader from '@/features/spots/components/SpotsHeader.vue'
import { useBottomSheet } from '@/shared/composables/useBottomSheet'
import { useImmersiveMode } from '@/shared/composables/useImmersiveMode'
import { useSpots } from '@/features/spots/composables/useSpots'
import { useSpotsSearch } from '@/features/spots/composables/useSpotsSearch'
import { DEFAULT_FILTERS, isFilterActive } from '@/features/spots/utils/spotFilters'

const { t } = useI18n()
const bottomSheet = useBottomSheet()
const { isImmersive } = useImmersiveMode()
const { spots, loading, load, ensureUserPos } = useSpots()
const { query: searchQuery } = useSpotsSearch()

const mapRef = ref(null)
const currentView = ref('map')
const isLocating = ref(false)
const filters = ref({ ...DEFAULT_FILTERS })
const focusedSpotId = ref(null)

let refetchTimer = null

const isSearching = computed(() => !!searchQuery.value.trim())
const showResults = computed(() => currentView.value === 'map' && isSearching.value)
const hasActiveFilters = computed(() => isFilterActive(filters.value))

// Alcance del fetch según la vista:
// - LISTA -> catálogo global (todos, o todos los que coinciden por nombre).
// - MAPA  -> proximidad: spots dentro del radio alrededor del usuario (+ nombre).
const buildParams = async () => {
  const name = searchQuery.value.trim()

  if (currentView.value === 'list') {
    return name ? { name } : {}
  }

  const pos = await ensureUserPos()
  if (pos) {
    const params = { lat: pos.lat, lng: pos.lng, radius: filters.value.radiusKm }
    if (name) params.name = name
    return params
  }
  // Sin ubicación en el mapa: cae a global.
  return name ? { name } : {}
}

const refetch = async ({ fit = true } = {}) => {
  await load(await buildParams())
  focusedSpotId.value = null
  if (fit && currentView.value === 'map') {
    if (spots.value.length) mapRef.value?.fitToSpots(spots.value)
    else mapRef.value?.centerOnUser()
  }
}

const debouncedRefetch = () => {
  clearTimeout(refetchTimer)
  refetchTimer = setTimeout(refetch, 350)
}

const onMapReady = () => refetch()

const selectResult = (id) => {
  focusedSpotId.value = id
}

watch(currentView, (v) => {
  isImmersive.value = v === 'list'
  refetch()
})
watch(searchQuery, () => {
  focusedSpotId.value = null
  debouncedRefetch()
})

onBeforeUnmount(() => {
  isImmersive.value = false
  searchQuery.value = ''
  clearTimeout(refetchTimer)
})

const handleLocate = async () => {
  if (isLocating.value || !mapRef.value) return
  isLocating.value = true
  focusedSpotId.value = null // ir a mi posición deselecciona el pin enfocado
  await mapRef.value.centerOnUser()
  isLocating.value = false
}

const applyFilters = async (newFilters) => {
  filters.value = newFilters
  bottomSheet.close()
  // No encuadramos a los spots aquí: la circunferencia del radio hace el encuadre.
  await refetch({ fit: false })
  if (currentView.value === 'map') {
    const pos = await ensureUserPos()
    if (pos) mapRef.value?.showRadius(pos, newFilters.radiusKm)
    else if (spots.value.length) mapRef.value?.fitToSpots(spots.value)
  }
}

const openFilters = () => {
  bottomSheet.open(SpotFiltersBottomSheet, {
    filters: filters.value,
    onApply: applyFilters,
  }, {
    title: t('spots.filters.title'),
    closable: true,
  })
}
</script>

<template>
  <div class="spots-orchestrator-full">

    <SpotsHeader
      v-model:current-view="currentView"
      :is-locating="isLocating"
      :has-active-filters="hasActiveFilters"
      @locate="handleLocate"
      @filter="openFilters"
    />

    <InteractiveMap
      ref="mapRef"
      :spots="spots"
      :focused-id="focusedSpotId"
      @ready="onMapReady"
      @spot-click="selectResult"
    />

    <Transition name="slide-up">
      <SpotSearchResults
        v-if="showResults"
        :spots="spots"
        :query="searchQuery"
        :loading="loading"
        :focused-id="focusedSpotId"
        @select="selectResult"
      />
    </Transition>

    <Transition name="slide-up">
      <ImmersiveSpotList
        v-show="currentView === 'list'"
        class="immersive-layer"
        :spots="spots"
      />
    </Transition>

  </div>
</template>

<style scoped>
.spots-orchestrator-full {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.immersive-layer {
  z-index: 10;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}
</style>
