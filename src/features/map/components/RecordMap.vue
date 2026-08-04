<script setup>
import { ref, onMounted, onUnmounted, shallowRef, computed, watch } from 'vue'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { locationService } from '@/features/tracking/services/locationService'
import { gpsSimulator, isSimEnabled } from '@/features/tracking/services/gpsSimulator'
import { toGeoJSON } from '@/features/tracking/utils/geo'

const props = defineProps({
  // Puntos de la ruta: [{ lat, lng, alt, accuracy, timestamp }]
  points: {
    type: Array,
    default: () => [],
  },
})

const ROUTE_SOURCE = 'route'
const FOLLOW_ZOOM = 16

const mapContainer = ref(null)
const map = shallowRef(null)
const userMarker = shallowRef(null)
const isLoaded = ref(false)

// Fuente de la posición inicial: simulador en modo dev, GPS real en producción.
const positionSource = isSimEnabled() ? gpsSimulator : locationService

const defaultCenter = [-104.316111, 19.053333]

const isDarkMode = ref(false)
let observer = null

const mapStyle = computed(() =>
  isDarkMode.value
    ? 'https://tiles.openfreemap.org/styles/positron'
    : 'https://tiles.openfreemap.org/styles/liberty',
)

const lastPoint = computed(() => props.points.at(-1) ?? null)

const ensureRouteLayer = () => {
  if (!map.value || map.value.getSource(ROUTE_SOURCE)) return

  map.value.addSource(ROUTE_SOURCE, {
    type: 'geojson',
    data: toGeoJSON(props.points),
  })

  map.value.addLayer({
    id: 'route-line',
    type: 'line',
    source: ROUTE_SOURCE,
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: {
      'line-color': getPrimaryColor(),
      'line-width': 5,
      'line-opacity': 0.95,
    },
  })
}

const getPrimaryColor = () => {
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-primary')
    .trim()
  return v || '#1f7d4f'
}

const updateRoute = () => {
  const src = map.value?.getSource(ROUTE_SOURCE)
  if (src) src.setData(toGeoJSON(props.points))
}

const moveMarker = (lng, lat) => {
  if (!map.value) return
  if (!userMarker.value) {
    const el = document.createElement('div')
    el.className = 'user-location-pulse'
    userMarker.value = new maplibregl.Marker({ element: el })
      .setLngLat([lng, lat])
      .addTo(map.value)
  } else {
    userMarker.value.setLngLat([lng, lat])
  }
}

const followCamera = (lng, lat) => {
  map.value?.easeTo({ center: [lng, lat], duration: 800, essential: true })
}

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
    zoom: FOLLOW_ZOOM,
    pitch: 0,
    interactive: false, // mapa bloqueado: sin pan/zoom/rotación
    attributionControl: false,
  })

  map.value.on('load', async () => {
    isLoaded.value = true
    ensureRouteLayer()

    // Centrar en la ubicación real (o simulada) ya en estado idle.
    try {
      const pos = await positionSource.getCurrentPosition()
      moveMarker(pos.longitude, pos.latitude)
      map.value.jumpTo({ center: [pos.longitude, pos.latitude], zoom: FOLLOW_ZOOM })
    } catch (err) {
      console.warn('Ubicación predeterminada usada en RecordMap', err)
    }
  })
})

// Redibuja la ruta, mueve el marcador y sigue la cámara conforme llegan puntos.
watch(
  () => props.points.length,
  () => {
    if (!isLoaded.value) return
    updateRoute()
    if (lastPoint.value) {
      moveMarker(lastPoint.value.lng, lastPoint.value.lat)
      followCamera(lastPoint.value.lng, lastPoint.value.lat)
    }
  },
)

watch(mapStyle, (newStyle) => {
  if (!map.value) return
  map.value.setStyle(newStyle)
  // setStyle elimina capas/fuentes propias; se reañaden al recargar el estilo.
  map.value.once('styledata', () => {
    ensureRouteLayer()
    updateRoute()
  })
})

const recenter = () => {
  if (lastPoint.value) {
    map.value?.easeTo({
      center: [lastPoint.value.lng, lastPoint.value.lat],
      zoom: FOLLOW_ZOOM,
      duration: 600,
      essential: true,
    })
  }
}

defineExpose({ recenter })

onUnmounted(() => {
  if (observer) observer.disconnect()
  if (map.value) map.value.remove()
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
  inset: 0;
  width: 100%;
  height: 100%;
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
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
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

</style>
