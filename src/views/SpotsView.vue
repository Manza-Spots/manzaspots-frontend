<script setup>
import { ref } from 'vue'
import InteractiveMap from '@/features/map/components/InteractiveMap.vue'
import SpotListCard from '@/features/spots/components/SpotListCard.vue'
import SpotFiltersBottomSheet from '@/features/spots/components/FiltersMenu.vue'
import SpotsHeader from '@/features/spots/components/SpotsHeader.vue'
import { useBottomSheet } from '@/shared/composables/useBottomSheet'

const bottomSheet = useBottomSheet()
const mapRef = ref(null)
const currentView = ref('map')
const isLocating = ref(false)

const mockSpots = [
  { id: 1, name: 'Mirador de Playa Miramar', category: 'Mirador', distance: '1.2 km', imageUrl: 'https://images.unsplash.com/photo-1596395819057-e37f55a8516d?q=80&w=600&auto=format&fit=crop', description: 'Excelente vista a la bahía con fácil acceso pavimentado.' },
  { id: 2, name: 'Cerro del Toro', category: 'Trekking', distance: '3.5 km', imageUrl: 'https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=600&auto=format&fit=crop', description: 'Ruta exigente con gran recompensa visual de la costa del Océano Pacífico.' },
  { id: 3, name: 'Cascada de Juluapan', category: 'Cascadas', distance: '12 km', imageUrl: 'https://images.unsplash.com/photo-1432405972618-c600f4871656?q=80&w=600&auto=format&fit=crop', description: 'Lugar exótico con albercas naturales perfectas para un chapuzón fresco.' },
  { id: 4, name: 'Punta de Cuastecomates', category: 'Playa Inclusiva', distance: '15 km', imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop', description: 'Bahía totalmente protegida con poco oleaje. Recomendable para familias.' },
  { id: 5, name: 'Punta de Cuastecomates', category: 'Playa Inclusiva', distance: '15 km', imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop', description: 'Bahía totalmente protegida con poco oleaje. Recomendable para familias.' },
  { id: 6, name: 'Punta de Cuastecomates', category: 'Playa Inclusiva', distance: '15 km', imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop', description: 'Bahía totalmente protegida con poco oleaje. Recomendable para familias.' },
  { id: 7, name: 'Punta de Cuastecomates', category: 'Playa Inclusiva', distance: '15 km', imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop', description: 'Bahía totalmente protegida con poco oleaje. Recomendable para familias.' }
]

const handleLocate = async () => {
  if (isLocating.value || !mapRef.value) return
  isLocating.value = true
  await mapRef.value.centerOnUser()
  isLocating.value = false
}

const openFilters = () => {
  bottomSheet.open(SpotFiltersBottomSheet, {}, {
    title: 'Filtros',
    closable: true,
  })
}
</script>

<template>
  <div class="spots-orchestrator-full">

    <SpotsHeader
      v-model:current-view="currentView"
      :is-locating="isLocating"
      @locate="handleLocate"
      @filter="openFilters"
    />

    <InteractiveMap ref="mapRef" />

    <Transition name="slide-up">
      <div v-show="currentView === 'list'" class="list-view-container">

        <div class="list-fade-top"></div>
        <div class="list-fade-bottom"></div>

        <div class="cards-scroll-area">
          <SpotListCard
            v-for="spot in mockSpots"
            :key="spot.id"
            :spot="spot"
          />
          <div class="spacer-bottom"></div>
        </div>
      </div>
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

.list-view-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: var(--color-bg);
  z-index: 10;
  display: flex;
  flex-direction: column;
}

.list-fade-top {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 140px;
  background: color-mix(in srgb, var(--color-bg) 50%, transparent);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  mask-image: linear-gradient(to bottom, black 20%, transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, black 20%, transparent 100%);
  z-index: 15;
  pointer-events: none;
}

.list-fade-bottom {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 160px;
  background: color-mix(in srgb, var(--color-bg) 50%, transparent);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  mask-image: linear-gradient(to top, black 10%, transparent 100%);
  -webkit-mask-image: linear-gradient(to top, black 10%, transparent 100%);
  z-index: 15;
  pointer-events: none;
}

.cards-scroll-area {
  flex: 1;
  overflow-y: auto;
  padding: 120px var(--space-4) var(--space-4);
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.cards-scroll-area::-webkit-scrollbar {
  display: none;
}

.spacer-bottom {
  height: calc(100px + var(--safe-area-inset-bottom, 20px));
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
