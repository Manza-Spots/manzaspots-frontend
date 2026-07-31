<script setup>
import { computed, ref, watch, onBeforeUnmount, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import InteractiveMap from '@/features/map/components/InteractiveMap.vue'
import ImmersiveSpotList from '@/features/spots/components/ImmersiveSpotList.vue'
import SpotFiltersBottomSheet from '@/features/spots/components/FiltersMenu.vue'
import SpotsHeader from '@/features/spots/components/SpotsHeader.vue'
import { useBottomSheet } from '@/shared/composables/useBottomSheet'
import { useImmersiveMode } from '@/shared/composables/useImmersiveMode'
import { useSpots } from '@/features/spots/composables/useSpots'
import { DEFAULT_FILTERS, filterSpots, isFilterActive } from '@/features/spots/utils/spotFilters'

const { t } = useI18n()
const bottomSheet = useBottomSheet()
const { isImmersive } = useImmersiveMode()
const mapRef = ref(null)
const currentView = ref('map')
const isLocating = ref(false)
const filters = ref({ ...DEFAULT_FILTERS })

const { spots, load } = useSpots()
onMounted(load)

watch(currentView, (v) => { isImmersive.value = v === 'list' }, { immediate: true })
onBeforeUnmount(() => { isImmersive.value = false })

const filteredSpots = computed(() => filterSpots(spots.value, filters.value))
const hasActiveFilters = computed(() => isFilterActive(filters.value))

const handleLocate = async () => {
  if (isLocating.value || !mapRef.value) return
  isLocating.value = true
  await mapRef.value.centerOnUser()
  isLocating.value = false
}

const applyFilters = (newFilters) => {
  filters.value = newFilters
  bottomSheet.close()
}

const openFilters = () => {
  bottomSheet.open(SpotFiltersBottomSheet, {
    spots: spots.value,
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

    <InteractiveMap ref="mapRef" />

    <Transition name="slide-up">
      <ImmersiveSpotList
        v-show="currentView === 'list'"
        class="immersive-layer"
        :spots="filteredSpots"
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
