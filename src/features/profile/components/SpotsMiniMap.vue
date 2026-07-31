<script setup>
import { ref, shallowRef, computed, onMounted, onUnmounted, watch } from 'vue'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const props = defineProps({
  // Spots mapeados: cada uno con `location: { lng, lat }`.
  spots: {
    type: Array,
    default: () => [],
  },
})

const SOURCE = 'mini-spots'
const LAYER = 'mini-spots-layer'
const defaultCenter = [-104.316111, 19.053333]

const container = ref(null)
const map = shallowRef(null)
const isDark = ref(false)
let observer = null

const mapStyle = computed(() =>
  isDark.value
    ? 'https://tiles.openfreemap.org/styles/positron'
    : 'https://tiles.openfreemap.org/styles/liberty',
)

const getPrimaryColor = () => {
  const v = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim()
  return v || '#1f7d4f'
}

const featureCollection = () => ({
  type: 'FeatureCollection',
  features: (props.spots || [])
    .filter((s) => s.location)
    .map((s) => ({
      type: 'Feature',
      properties: {},
      geometry: { type: 'Point', coordinates: [s.location.lng, s.location.lat] },
    })),
})

const ensureLayer = () => {
  if (!map.value || map.value.getSource(SOURCE)) return
  map.value.addSource(SOURCE, { type: 'geojson', data: featureCollection() })
  map.value.addLayer({
    id: LAYER,
    type: 'circle',
    source: SOURCE,
    paint: {
      'circle-radius': 6,
      'circle-color': getPrimaryColor(),
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff',
    },
  })
}

const fit = () => {
  const pts = (props.spots || []).filter((s) => s.location)
  if (!map.value || !pts.length) return
  if (pts.length === 1) {
    map.value.jumpTo({ center: [pts[0].location.lng, pts[0].location.lat], zoom: 12 })
    return
  }
  const bounds = new maplibregl.LngLatBounds()
  pts.forEach((s) => bounds.extend([s.location.lng, s.location.lat]))
  map.value.fitBounds(bounds, { padding: 34, maxZoom: 13, animate: false })
}

const refresh = () => {
  const src = map.value?.getSource(SOURCE)
  if (src) src.setData(featureCollection())
  fit()
}

onMounted(() => {
  isDark.value = document.documentElement.classList.contains('dark')
  observer = new MutationObserver(() => {
    isDark.value = document.documentElement.classList.contains('dark')
  })
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

  if (!container.value) return
  map.value = new maplibregl.Map({
    container: container.value,
    style: mapStyle.value,
    center: defaultCenter,
    zoom: 10,
    interactive: false,
    attributionControl: false,
  })
  map.value.on('load', () => {
    ensureLayer()
    fit()
  })
})

watch(() => props.spots, refresh)

watch(mapStyle, (style) => {
  if (!map.value) return
  map.value.setStyle(style)
  map.value.once('styledata', () => {
    ensureLayer()
    refresh()
  })
})

onUnmounted(() => {
  if (observer) observer.disconnect()
  if (map.value) map.value.remove()
})
</script>

<template>
  <div ref="container" class="mini-map"></div>
</template>

<style scoped>
.mini-map {
  width: 100%;
  height: 100%;
  /* Los taps los maneja el contenedor clickable del padre. */
  pointer-events: none;
}
</style>
