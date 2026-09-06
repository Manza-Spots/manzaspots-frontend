<script setup>
import { ref, onMounted, onUnmounted, shallowRef, computed, watch } from 'vue'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const props = defineProps({
  location: {
    type: Object,
    default: null,
  },

  routes: {
    type: Array,
    default: () => [],
  },

  selectedId: {
    type: [Number, String],
    default: null,
  },

  bottomPadding: {
    type: Number,
    default: 0,
  },

  isFavorite: {
    type: Boolean,
    default: false,
  },
})

const MIN_ROOM = 60

const SOURCE = 'spot-routes'
const LAYER_DIM = 'routes-dim'
const LAYER_HALO = 'routes-halo'
const LAYER_ACTIVE = 'routes-active'

const mapContainer = ref(null)
const map = shallowRef(null)
const isLoaded = ref(false)

const isDarkMode = ref(false)
let observer = null
let resizeObserver = null
let marker = null

const mapStyle = computed(() =>
  isDarkMode.value
    ? 'https://tiles.openfreemap.org/styles/positron'
    : 'https://tiles.openfreemap.org/styles/liberty',
)

const cssVar = (name, fallback) => {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

const center = computed(() => (props.location ? [props.location.lng, props.location.lat] : null))

const routesGeoJSON = () => ({
  type: 'FeatureCollection',
  features: props.routes
    .filter((r) => r.path?.type === 'LineString' && Array.isArray(r.path.coordinates))
    .map((r) => ({
      type: 'Feature',
      geometry: r.path,
      properties: { routeId: r.id },
    })),
})

const isSelected = () => ['==', ['get', 'routeId'], props.selectedId ?? -1]
const isNotSelected = () => ['!=', ['get', 'routeId'], props.selectedId ?? -1]

const ensureLayers = () => {
  if (!map.value || map.value.getSource(SOURCE)) return

  map.value.addSource(SOURCE, { type: 'geojson', data: routesGeoJSON() })

  map.value.addLayer({
    id: LAYER_DIM,
    type: 'line',
    source: SOURCE,
    filter: isNotSelected(),
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: {
      'line-color': cssVar('--color-text-tertiary', '#8b948c'),
      'line-width': 4,
      'line-opacity': 0.45,
    },
  })

  map.value.addLayer({
    id: LAYER_HALO,
    type: 'line',
    source: SOURCE,
    filter: isSelected(),
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: { 'line-color': '#ffffff', 'line-width': 10, 'line-opacity': 0.85 },
  })

  map.value.addLayer({
    id: LAYER_ACTIVE,
    type: 'line',
    source: SOURCE,
    filter: isSelected(),
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: { 'line-color': cssVar('--color-primary', '#1f7d4f'), 'line-width': 6 },
  })
}

const applySelection = () => {
  if (!map.value?.getLayer(LAYER_DIM)) return
  map.value.setFilter(LAYER_DIM, isNotSelected())
  map.value.setFilter(LAYER_HALO, isSelected())
  map.value.setFilter(LAYER_ACTIVE, isSelected())
}

const pinSvg = () => {
  const star = props.isFavorite
    ? '<path d="M24,13 L26.2,18.9 L32.6,19.2 L27.6,23.2 L29.3,29.3 L24,25.8 L18.7,29.3 L20.4,23.2 L15.4,19.2 L21.8,18.9 Z" fill="#ffffff"/>'
    : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="42" viewBox="0 0 48 60"><path d="M24,58 C14,42 6,34 6,22 A18,18 0 1,1 42,22 C42,34 34,42 24,58 Z" fill="${cssVar('--color-primary', '#1f7d4f')}" stroke="#ffffff" stroke-width="3"/>${star}</svg>`
}

const addMarker = () => {
  if (!map.value || !center.value || marker) return
  const el = document.createElement('div')
  el.className = 'spot-pin'
  el.innerHTML = pinSvg()
  marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
    .setLngLat(center.value)
    .addTo(map.value)
}

const frame = ({ animate = true } = {}) => {
  if (!map.value || !center.value) return

  const features = routesGeoJSON().features
  const selected = features.find((f) => f.properties.routeId === props.selectedId)
  const target = selected ? [selected] : features

  const bounds = new maplibregl.LngLatBounds()
  bounds.extend(center.value)
  target.forEach((f) => f.geometry.coordinates.forEach((c) => bounds.extend(c)))

  const padding = {
    top: 90,
    left: 40,
    right: 40,
    bottom: Math.max(props.bottomPadding + 24, 40),
  }

  const height = mapContainer.value?.clientHeight || 0
  const excess = padding.top + padding.bottom + MIN_ROOM - height
  if (excess > 0) {
    const fromBottom = Math.min(excess, padding.bottom)
    padding.bottom -= fromBottom
    padding.top = Math.max(padding.top - (excess - fromBottom), 0)
  }

  if (bounds.getNorthEast().toString() === bounds.getSouthWest().toString()) {
    map.value.easeTo({ center: center.value, zoom: 14, padding, duration: animate ? 500 : 0 })
    return
  }
  map.value.fitBounds(bounds, { padding, maxZoom: 16, duration: animate ? 600 : 0 })
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
    center: center.value ?? [-104.316111, 19.053333],
    zoom: 14,
    pitch: 0,
    attributionControl: false,
  })

  map.value.on('load', () => {
    isLoaded.value = true
    ensureLayers()
    addMarker()
    frame({ animate: false })
  })

  resizeObserver = new ResizeObserver(() => map.value?.resize())
  resizeObserver.observe(mapContainer.value)
})

watch(
  () => props.routes,
  () => {
    if (!isLoaded.value) return
    map.value?.getSource(SOURCE)?.setData(routesGeoJSON())
    applySelection()
    frame()
  },
)

watch(
  () => props.selectedId,
  () => {
    if (!isLoaded.value) return
    applySelection()
    frame()
  },
)

watch(
  () => props.bottomPadding,
  () => {
    if (isLoaded.value) frame()
  },
)

watch(
  () => props.isFavorite,
  () => {
    if (marker) marker.getElement().innerHTML = pinSvg()
  },
)

watch(mapStyle, (style) => {
  if (!map.value) return
  map.value.setStyle(style)

  map.value.once('styledata', () => {
    ensureLayers()
    map.value?.getSource(SOURCE)?.setData(routesGeoJSON())
    applySelection()
  })
})

onUnmounted(() => {
  observer?.disconnect()
  resizeObserver?.disconnect()
  map.value?.remove()
})

defineExpose({ frame })
</script>

<template>
  <div ref="mapContainer" class="spot-location-map"></div>
</template>

<style scoped>
.spot-location-map {
  width: 100%;
  height: 100%;
  background: var(--color-surface-2);
}
</style>
