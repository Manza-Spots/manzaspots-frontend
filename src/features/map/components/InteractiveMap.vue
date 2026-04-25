<script setup>
import { ref, onMounted, onUnmounted, shallowRef, computed, watch } from 'vue'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { locationService } from '@/features/tracking/services/locationService'

const mapContainer = ref(null)
const map = shallowRef(null)

const defaultCenter = [-104.316111, 19.053333]

const isDarkMode = ref(false)
let observer = null

const mapStyle = computed(() => {
  return isDarkMode.value
    ? 'https://tiles.openfreemap.org/styles/positron'
    : 'https://tiles.openfreemap.org/styles/liberty'
})

onMounted(() => {
  isDarkMode.value = document.documentElement.classList.contains('dark')

  observer = new MutationObserver(() => {
    isDarkMode.value = document.documentElement.classList.contains('dark')
  })
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

  if (!mapContainer.value) return

  map.value = new maplibregl.Map({
    container: mapContainer.value,
    style: mapStyle.value,
    center: defaultCenter,
    zoom: 12,
    pitch: 0,
    maxPitch: 60,
    attributionControl: false,
  })

  map.value.on('load', () => {
    console.log('MapLibre GL cargado correctamente')

    const el = document.createElement('div')
    el.className = 'user-location-pulse'

    const userMarker = new maplibregl.Marker({ element: el })
      .setLngLat(defaultCenter)
      .addTo(map.value)

    locationService.startTracking((pos) => {
      userMarker.setLngLat([pos.longitude, pos.latitude])
    }).catch(err => {
      console.warn('Ubicación predeterminada usada', err)
      userMarker.remove()
    })
  })
})

watch(mapStyle, (newStyle) => {
  if (map.value) {
    map.value.setStyle(newStyle)
  }
})

const centerOnUser = async () => {
  if (!map.value) return

  try {
    const pos = await locationService.getCurrentPosition()
    map.value.flyTo({
      center: [pos.longitude, pos.latitude],
      zoom: 15,
      pitch: 0,
      speed: 1.2,
      essential: true
    })
    return true
  } catch (err) {
    console.warn('Usuario denegó o falló la ubicación.', err)
    return false
  }
}

defineExpose({
  centerOnUser
})

onUnmounted(() => {
  if (observer) observer.disconnect()
  locationService.stopTracking()

  if (map.value) {
    map.value.remove()
  }
})
</script>

<template>
  <div class="map-wrapper">
    <div ref="mapContainer" class="map-container"></div>
  </div>
</template>

<style scoped>
.map-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0;
}

.map-container {
  width: 100%;
  height: 100%;
}

:deep(.user-location-pulse) {
  width: 20px;
  height: 20px;
  background-color: var(--color-primary);
  border: 3px solid white;
  border-radius: 50%;
  box-shadow: 0 0 10px rgba(0,0,0,0.3);
  position: relative;
  z-index: 100;
}

:deep(.user-location-pulse::after) {
  content: '';
  position: absolute;
  top: -10px;
  left: -10px;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background-color: rgba(0, 122, 255, 0.4);
  animation: pulse-ring 2s infinite ease-out;
  pointer-events: none;
}

@keyframes pulse-ring {
  0% { transform: scale(0.5); opacity: 1; }
  100% { transform: scale(1.5); opacity: 0; }
}
</style>
