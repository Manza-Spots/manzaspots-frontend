<script setup>
import { ref, onMounted, onUnmounted, shallowRef, computed, watch } from 'vue'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { locationService } from '@/features/tracking/services/locationService'

const props = defineProps({
  // Spots a pintar como marcadores. Cada uno con `location: { lng, lat }`.
  spots: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['boundschange', 'spot-click'])

const SPOTS_SOURCE = 'spots'
const SPOTS_LAYER = 'spots-markers'
const PIN_IMAGE = 'spot-pin'
const PIN_FAV_IMAGE = 'spot-pin-fav'
const MOVE_DEBOUNCE_MS = 400

const mapContainer = ref(null)
const map = shallowRef(null)

const defaultCenter = [-104.316111, 19.053333]

const isDarkMode = ref(false)
let observer = null
let moveTimer = null

const mapStyle = computed(() => {
  return isDarkMode.value
    ? 'https://tiles.openfreemap.org/styles/positron'
    : 'https://tiles.openfreemap.org/styles/liberty'
})

const getPrimaryColor = () => {
  const v = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim()
  return v || '#1f7d4f'
}

// Pin de gota verde. Si es favorito lleva una estrella blanca; si no, va liso.
const pinSvg = (favorite, color) => {
  const star = favorite
    ? '<path d="M24,13 L26.2,18.9 L32.6,19.2 L27.6,23.2 L29.3,29.3 L24,25.8 L18.7,29.3 L20.4,23.2 L15.4,19.2 L21.8,18.9 Z" fill="#ffffff"/>'
    : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="120" viewBox="0 0 48 60"><path d="M24,58 C14,42 6,34 6,22 A18,18 0 1,1 42,22 C42,34 34,42 24,58 Z" fill="${color}" stroke="#ffffff" stroke-width="3"/>${star}</svg>`
}

const addPinImage = (id, svg) =>
  new Promise((resolve) => {
    if (!map.value || map.value.hasImage(id)) return resolve()
    const img = new Image()
    img.onload = () => {
      if (map.value && !map.value.hasImage(id)) map.value.addImage(id, img, { pixelRatio: 2 })
      resolve()
    }
    img.onerror = () => resolve()
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
  })

const ensurePinImages = () => {
  const color = getPrimaryColor()
  return Promise.all([
    addPinImage(PIN_IMAGE, pinSvg(false, color)),
    addPinImage(PIN_FAV_IMAGE, pinSvg(true, color)),
  ])
}

const spotsToFeatureCollection = (spots) => ({
  type: 'FeatureCollection',
  features: (spots || [])
    .filter((s) => s.location)
    .map((s) => ({
      type: 'Feature',
      properties: { id: s.id, name: s.name, is_favorite: !!s.isFavorite },
      geometry: { type: 'Point', coordinates: [s.location.lng, s.location.lat] },
    })),
})

// Fuente + capa de marcadores. Idempotente (se re-invoca al cambiar de estilo).
const ensureSpotsLayer = async () => {
  if (!map.value || map.value.getSource(SPOTS_SOURCE)) return

  await ensurePinImages()
  if (!map.value || map.value.getSource(SPOTS_SOURCE)) return

  map.value.addSource(SPOTS_SOURCE, {
    type: 'geojson',
    data: spotsToFeatureCollection(props.spots),
  })

  map.value.addLayer({
    id: SPOTS_LAYER,
    type: 'symbol',
    source: SPOTS_SOURCE,
    layout: {
      'icon-image': ['case', ['get', 'is_favorite'], PIN_FAV_IMAGE, PIN_IMAGE],
      'icon-anchor': 'bottom',
      'icon-size': 0.55,
      'icon-allow-overlap': true,
    },
  })

  map.value.on('click', SPOTS_LAYER, (e) => {
    const feature = e.features?.[0]
    if (feature) emit('spot-click', feature.properties.id)
  })
  map.value.on('mouseenter', SPOTS_LAYER, () => {
    map.value.getCanvas().style.cursor = 'pointer'
  })
  map.value.on('mouseleave', SPOTS_LAYER, () => {
    map.value.getCanvas().style.cursor = ''
  })
}

const updateSpots = () => {
  const source = map.value?.getSource(SPOTS_SOURCE)
  if (source) source.setData(spotsToFeatureCollection(props.spots))
}

// Emite el bounding box actual para que el padre pida los spots del viewport.
const emitBounds = () => {
  if (!map.value) return
  const b = map.value.getBounds()
  emit('boundschange', {
    sw_lat: b.getSouth(),
    sw_lng: b.getWest(),
    ne_lat: b.getNorth(),
    ne_lng: b.getEast(),
  })
}

const onMoveEnd = () => {
  clearTimeout(moveTimer)
  moveTimer = setTimeout(emitBounds, MOVE_DEBOUNCE_MS)
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
    zoom: 12,
    pitch: 0,
    maxPitch: 60,
    attributionControl: false,
  })

  map.value.on('load', () => {
    const el = document.createElement('div')
    el.className = 'user-location-pulse'

    const userMarker = new maplibregl.Marker({ element: el })
      .setLngLat(defaultCenter)
      .addTo(map.value)

    locationService
      .startTracking((pos) => {
        userMarker.setLngLat([pos.longitude, pos.latitude])
      })
      .catch((err) => {
        console.warn('Ubicación predeterminada usada', err)
        userMarker.remove()
      })

    ensureSpotsLayer()
    emitBounds() // primer lote: spots del viewport inicial
    map.value.on('moveend', onMoveEnd)
  })
})

watch(
  () => props.spots,
  () => updateSpots(),
)

watch(mapStyle, (newStyle) => {
  if (!map.value) return
  map.value.setStyle(newStyle)
  // setStyle limpia fuentes/capas/imágenes propias: se reañaden al recargar el estilo.
  map.value.once('styledata', async () => {
    await ensureSpotsLayer()
    updateSpots()
  })
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
      essential: true,
    })
    return true
  } catch (err) {
    console.warn('Usuario denegó o falló la ubicación.', err)
    return false
  }
}

defineExpose({
  centerOnUser,
})

onUnmounted(() => {
  if (observer) observer.disconnect()
  clearTimeout(moveTimer)
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

@keyframes pulse-ring {
  0% { transform: scale(0.5); opacity: 1; }
  100% { transform: scale(1.5); opacity: 0; }
}
</style>
