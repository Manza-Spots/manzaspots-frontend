<script setup>
import { ref, onMounted, onUnmounted, shallowRef, computed, watch } from 'vue'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { angleDiff } from '@/features/tracking/utils/routeGuide'

const props = defineProps({
  // Ruta a seguir (GeoJSON LineString).
  route: {
    type: Object,
    required: true,
  },
  // Posición a mostrar [lng, lat]; null hasta la primera lectura del GPS.
  position: {
    type: Array,
    default: null,
  },
  // Rumbo de la cámara y de la flecha, en grados.
  bearing: {
    type: Number,
    default: 0,
  },
  userHeading: {
    type: Number,
    default: 0,
  },
  // Fracción recorrida (0-1): el tramo hecho se apaga.
  progress: {
    type: Number,
    default: 0,
  },
  // nav: perspectiva detrás de la flecha · overview: toda la ruta desde arriba.
  mode: {
    type: String,
    default: 'nav',
  },
  // Alto (px) que tapan el cartel de arriba y el panel de abajo: la cámara
  // encuadra solo la franja visible entre ambos.
  insets: {
    type: Object,
    default: () => ({ top: 0, bottom: 0 }),
  },
})

const ROUTE_SOURCE = 'follow-route'
const NAV_ZOOM = 17
// Una inclinación mayor dibuja hasta el horizonte: más tiles, datos y batería.
const NAV_PITCH = 55
// La flecha va en la parte baja de la franja visible para ver más ruta por delante.
const NAV_ARROW_AT = 0.75
// Constantes de tiempo (s) del suavizado entre lecturas del GPS.
const POSITION_TAU = 0.45
const BEARING_TAU = 0.35

const mapContainer = ref(null)
const map = shallowRef(null)
const isLoaded = ref(false)

let userMarker = null
let frame = null
let lastFrameTime = 0
let shown = null // { lng, lat, bearing, heading } dibujados en este cuadro
let flying = false

const isDarkMode = ref(false)
let observer = null

const mapStyle = computed(() =>
  isDarkMode.value
    ? 'https://tiles.openfreemap.org/styles/positron'
    : 'https://tiles.openfreemap.org/styles/liberty',
)

const cssVar = (name, fallback) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback

const routeFeature = () => ({ type: 'Feature', properties: {}, geometry: props.route })

const routeBounds = () => {
  const bounds = new maplibregl.LngLatBounds()
  props.route.coordinates.forEach((c) => bounds.extend(c))
  if (props.position) bounds.extend(props.position)
  return bounds
}

// El tramo recorrido se pinta apagado y el que falta con el color primario.
const progressGradient = () => {
  const done = cssVar('--color-text-tertiary', '#9aa3ad')
  const ahead = cssVar('--color-primary', '#1f7d4f')
  const cut = Math.min(Math.max(props.progress, 0.0001), 0.9999)
  return ['step', ['line-progress'], done, cut, ahead]
}

const ensureRouteLayers = () => {
  if (!map.value || map.value.getSource(ROUTE_SOURCE)) return
  map.value.addSource(ROUTE_SOURCE, { type: 'geojson', data: routeFeature(), lineMetrics: true })
  map.value.addLayer({
    id: 'follow-route-casing',
    type: 'line',
    source: ROUTE_SOURCE,
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: { 'line-color': '#ffffff', 'line-width': 11, 'line-opacity': 0.9 },
  })
  map.value.addLayer({
    id: 'follow-route-line',
    type: 'line',
    source: ROUTE_SOURCE,
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: { 'line-width': 7, 'line-gradient': progressGradient() },
  })
}

const addEndpointMarkers = () => {
  const coords = props.route.coordinates
  const make = (className, lngLat) => {
    const el = document.createElement('div')
    el.className = className
    new maplibregl.Marker({ element: el, pitchAlignment: 'map' }).setLngLat(lngLat).addTo(map.value)
  }
  make('follow-endpoint follow-endpoint--start', coords[0])
  make('follow-endpoint follow-endpoint--end', coords.at(-1))
}

const ensureUserMarker = (lngLat) => {
  if (userMarker) return
  const el = document.createElement('div')
  el.className = 'follow-arrow'
  el.innerHTML =
    '<svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true"><path d="M20 4 L33 34 L20 27 L7 34 Z"/></svg>'
  userMarker = new maplibregl.Marker({
    element: el,
    rotationAlignment: 'map',
    pitchAlignment: 'map',
  })
    .setLngLat(lngLat)
    .addTo(map.value)
}

// El centro de la cámara queda a la mitad del área sin padding; se calcula el
// padding de arriba que lo baja hasta NAV_ARROW_AT de la franja visible.
const navPadding = () => {
  const height = map.value?.getContainer().clientHeight ?? 0
  const { top, bottom } = props.insets
  const arrowY = top + (height - top - bottom) * NAV_ARROW_AT
  return { top: Math.max(2 * arrowY - height + bottom, 0), bottom, left: 0, right: 0 }
}

const NO_PADDING = { top: 0, bottom: 0, left: 0, right: 0 }

const showOverview = (duration = 800) => {
  if (!map.value) return
  // El padding de la navegación queda guardado en el mapa y cameraForBounds lo
  // suma al de aquí: sin quitarlo, no cabe la ruta y no devuelve cámara.
  const navPaddingNow = map.value.getPadding()
  map.value.setPadding(NO_PADDING)
  const camera = map.value.cameraForBounds(routeBounds(), {
    padding: {
      top: props.insets.top + 24,
      bottom: props.insets.bottom + 24,
      left: 40,
      right: 40,
    },
    bearing: 0,
  })
  map.value.setPadding(navPaddingNow)
  if (!camera) return
  map.value.easeTo({ ...camera, pitch: 0, padding: NO_PADDING, duration, essential: true })
}

// Pasa a la perspectiva con una animación; el bucle retoma la cámara al terminar.
const flyToNav = () => {
  if (!map.value || !shown) return
  flying = true
  map.value.easeTo({
    center: [shown.lng, shown.lat],
    bearing: shown.bearing,
    pitch: NAV_PITCH,
    zoom: NAV_ZOOM,
    padding: navPadding(),
    duration: 1200,
    essential: true,
  })
  map.value.once('moveend', () => {
    flying = false
  })
}

// Bucle de dibujo: acerca lo mostrado a lo último que dijo el GPS. Con lecturas
// cada ~1 s, mover la cámara solo al llegar cada una se vería a saltos.
const tick = (time) => {
  frame = requestAnimationFrame(tick)
  const dt = lastFrameTime ? Math.min((time - lastFrameTime) / 1000, 0.25) : 0
  lastFrameTime = time
  if (!shown || !props.position) return

  const kPos = 1 - Math.exp(-dt / POSITION_TAU)
  const kBear = 1 - Math.exp(-dt / BEARING_TAU)
  shown.lng += (props.position[0] - shown.lng) * kPos
  shown.lat += (props.position[1] - shown.lat) * kPos
  shown.bearing += angleDiff(shown.bearing, props.bearing) * kBear
  shown.heading += angleDiff(shown.heading, props.userHeading) * kBear

  userMarker?.setLngLat([shown.lng, shown.lat]).setRotation(shown.heading)
  if (props.mode === 'nav' && !flying) {
    map.value.jumpTo({ center: [shown.lng, shown.lat], bearing: shown.bearing, padding: navPadding() })
  }
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
    bounds: routeBounds(),
    fitBoundsOptions: { padding: 60 },
    maxPitch: 60,
    interactive: false, // la cámara la lleva la navegación
    attributionControl: false,
  })

  map.value.on('load', () => {
    isLoaded.value = true
    ensureRouteLayers()
    addEndpointMarkers()
    showOverview(0)
    frame = requestAnimationFrame(tick)
  })
})

// Primera lectura: aparece la flecha y la cámara vuela a la perspectiva.
watch(
  () => props.position,
  (pos) => {
    if (!pos || !isLoaded.value) return
    if (!shown) {
      shown = { lng: pos[0], lat: pos[1], bearing: props.bearing, heading: props.userHeading }
      ensureUserMarker(pos)
      if (props.mode === 'nav') flyToNav()
    }
  },
)

watch(
  () => props.mode,
  (mode) => {
    if (mode === 'overview') showOverview()
    else flyToNav()
  },
)

watch(
  () => props.progress,
  () => {
    if (isLoaded.value && map.value?.getLayer('follow-route-line')) {
      map.value.setPaintProperty('follow-route-line', 'line-gradient', progressGradient())
    }
  },
)

watch(mapStyle, (newStyle) => {
  if (!map.value) return
  map.value.setStyle(newStyle)
  // setStyle elimina capas/fuentes propias; se reañaden al recargar el estilo.
  map.value.once('styledata', ensureRouteLayers)
})

onUnmounted(() => {
  if (frame) cancelAnimationFrame(frame)
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

:deep(.follow-arrow) {
  width: 40px;
  height: 40px;
  filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.35));
}

:deep(.follow-arrow path) {
  fill: var(--color-primary);
  stroke: #fff;
  stroke-width: 3;
  stroke-linejoin: round;
}

:deep(.follow-endpoint) {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 3px solid #fff;
  box-shadow: var(--shadow-md);
}

:deep(.follow-endpoint--start) {
  background: var(--color-text-tertiary);
}

:deep(.follow-endpoint--end) {
  width: 22px;
  height: 22px;
  background: var(--color-coral);
}
</style>
