<script setup>
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import InteractiveMap from '@/features/map/components/InteractiveMap.vue'
import ImmersiveSpotList from '@/features/spots/components/ImmersiveSpotList.vue'
import SpotFiltersBottomSheet from '@/features/spots/components/FiltersMenu.vue'
import SpotsHeader from '@/features/spots/components/SpotsHeader.vue'
import { useBottomSheet } from '@/shared/composables/useBottomSheet'
import { useImmersiveMode } from '@/shared/composables/useImmersiveMode'
import { DEFAULT_FILTERS, filterSpots, isFilterActive } from '@/features/spots/utils/spotFilters'

import img1 from '@/assets/img/img1.jpeg'
import img2 from '@/assets/img/img2.jpeg'
import img3 from '@/assets/img/img3.jpeg'
import img4 from '@/assets/img/img4.jpeg'
import img5 from '@/assets/img/img5.jpeg'
import img6 from '@/assets/img/img6.jpeg'

const { t } = useI18n()
const bottomSheet = useBottomSheet()
const { isImmersive } = useImmersiveMode()
const mapRef = ref(null)
const currentView = ref('map')
const isLocating = ref(false)
const filters = ref({ ...DEFAULT_FILTERS })

watch(currentView, (v) => { isImmersive.value = v === 'list' }, { immediate: true })
onBeforeUnmount(() => { isImmersive.value = false })

const mockSpots = [
  { id: 1, name: 'Mirador de Playa Miramar', category: 'Mirador', distance: '1.2 km', imageUrl: img1, description: 'Excelente vista a la bahía con fácil acceso pavimentado.' },
  { id: 2, name: 'Cerro del Toro', category: 'Trekking', distance: '3.5 km', imageUrl: img2, description: 'Ruta exigente con gran recompensa visual de la costa del Océano Pacífico.' },
  { id: 3, name: 'Cascada de Juluapan', category: 'Cascadas', distance: '12 km', imageUrl: img3, description: 'Lugar exótico con albercas naturales perfectas para un chapuzón fresco.' },
  { id: 4, name: 'Punta de Cuastecomates', category: 'Playa Inclusiva', distance: '15 km', imageUrl: img4, description: 'Bahía totalmente protegida con poco oleaje. Recomendable para familias.' },
  { id: 5, name: 'Playa de Oro', category: 'Playa', distance: '18 km', imageUrl: img5, description: 'Famosa por su muelle y puestas de sol espectaculares en el horizonte.' },
  { id: 6, name: 'La Boquita', category: 'Playa', distance: '8 km', imageUrl: img6, description: 'Aguas tranquilas ideales para el snorkel y disfrutar con los más pequeños.' },
  { id: 1, name: 'Mirador de Playa Miramar', category: 'Mirador', distance: '1.2 km', imageUrl: img1, description: 'Excelente vista a la bahía con fácil acceso pavimentado.' },
  { id: 2, name: 'Cerro del Toro', category: 'Trekking', distance: '3.5 km', imageUrl: img2, description: 'Ruta exigente con gran recompensa visual de la costa del Océano Pacífico.' },
  { id: 3, name: 'Cascada de Juluapan', category: 'Cascadas', distance: '12 km', imageUrl: img3, description: 'Lugar exótico con albercas naturales perfectas para un chapuzón fresco.' },
  { id: 4, name: 'Punta de Cuastecomates', category: 'Playa Inclusiva', distance: '15 km', imageUrl: img4, description: 'Bahía totalmente protegida con poco oleaje. Recomendable para familias.' },
  { id: 5, name: 'Playa de Oro', category: 'Playa', distance: '18 km', imageUrl: img5, description: 'Famosa por su muelle y puestas de sol espectaculares en el horizonte.' },
  { id: 6, name: 'La Boquita', category: 'Playa', distance: '8 km', imageUrl: img6, description: 'Aguas tranquilas ideales para el snorkel y disfrutar con los más pequeños.' }
]

const filteredSpots = computed(() => filterSpots(mockSpots, filters.value))
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
    spots: mockSpots,
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
