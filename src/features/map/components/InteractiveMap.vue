<script setup>
import {
  ref,
  onMounted,
  onUnmounted,
  onActivated,
  onDeactivated,
  shallowRef,
  computed,
  watch,
} from 'vue'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { locationService } from '@/features/tracking/services/locationService'

const props = defineProps({
  // Spots a pintar como marcadores. Cada uno con `location: { lng, lat }`.
  spots: {
    type: Array,
    default: () => [],
  },
  // Id del spot enfocado (resultado seleccionado): se resalta y se vuela a él.
  focusedId: {
    type: [Number, String],
    default: null,
  },
})

const emit = defineEmits(['ready', 'spot-click'])

const SPOTS_SOURCE = 'spots'
const SPOTS_LAYER = 'spots-markers'
const SPOTS_HALO_LAYER = 'spots-halo'
const PIN_IMAGE = 'spot-pin'
const PIN_FAV_IMAGE = 'spot-pin-fav'
const RADIUS_SOURCE = 'radius-circle'

const mapContainer = ref(null)
const map = shallowRef(null)

const defaultCenter = [-104.316111, 19.053333]

const isDarkMode = ref(false)
let observer = null
let radiusTimer = null
let userMarker = null

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
      properties: {
        id: s.id,
        name: s.name,
        is_favorite: !!s.isFavorite,
        focused: s.id === props.focusedId,
      },
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

  // Halo bajo el pin enfocado (resaltado del resultado seleccionado).
  map.value.addLayer({
    id: SPOTS_HALO_LAYER,
    type: 'circle',
    source: SPOTS_SOURCE,
    filter: ['==', ['get', 'focused'], true],
    paint: {
      'circle-radius': 22,
      'circle-color': getPrimaryColor(),
      'circle-opacity': 0.18,
    },
  })

  map.value.addLayer({
    id: SPOTS_LAYER,
    type: 'symbol',
    source: SPOTS_SOURCE,
    layout: {
      'icon-image': ['case', ['get', 'is_favorite'], PIN_FAV_IMAGE, PIN_IMAGE],
      'icon-anchor': 'bottom',
      // El pin enfocado se agranda para destacarlo.
      'icon-size': ['case', ['get', 'focused'], 0.85, 0.55],
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

const followUser = () => {
  if (!userMarker) return
  locationService
    .startTracking((pos) => {
      userMarker?.setLngLat([pos.longitude, pos.latitude])
    })
    .catch((err) => {
      console.warn('Ubicación predeterminada usada', err)
      userMarker?.remove()
      userMarker = null
    })
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

    userMarker = new maplibregl.Marker({ element: el }).setLngLat(defaultCenter).addTo(map.value)

    followUser()
    ensureSpotsLayer()
    emit('ready')
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

// Encuadra el mapa a un conjunto de spots (resultados de búsqueda), para que
// los pines coincidentes siempre entren en pantalla.
const fitToSpots = (list) => {
  if (!map.value) return
  const pts = (list || []).filter((s) => s.location)
  if (!pts.length) return

  if (pts.length === 1) {
    map.value.flyTo({ center: [pts[0].location.lng, pts[0].location.lat], zoom: 14, essential: true })
    return
  }

  const bounds = new maplibregl.LngLatBounds()
  pts.forEach((s) => bounds.extend([s.location.lng, s.location.lat]))
  map.value.fitBounds(bounds, { padding: 80, maxZoom: 15, duration: 800 })
}

// Al cambiar el spot enfocado: recolorea/agranda y vuela hacia él.
watch(
  () => props.focusedId,
  (id) => {
    updateSpots()
    if (id == null) return
    const spot = props.spots.find((s) => s.id === id && s.location)
    if (spot) {
      map.value?.flyTo({ center: [spot.location.lng, spot.location.lat], zoom: 15, essential: true })
    }
  },
)

const toRad = (d) => (d * Math.PI) / 180
const toDeg = (r) => (r * 180) / Math.PI

// Polígono que aproxima un círculo geográfico de `radiusKm` alrededor de center.
const circlePolygon = (center, radiusKm, points = 72) => {
  const coords = []
  const d = radiusKm / 6371
  const lat1 = toRad(center.lat)
  const lng1 = toRad(center.lng)
  for (let i = 0; i <= points; i++) {
    const brng = (i / points) * 2 * Math.PI
    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(brng))
    const lng2 =
      lng1 +
      Math.atan2(Math.sin(brng) * Math.sin(d) * Math.cos(lat1), Math.cos(d) - Math.sin(lat1) * Math.sin(lat2))
    coords.push([toDeg(lng2), toDeg(lat2)])
  }
  return { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [coords] } }
}

const setRadiusOpacity = (fill, line) => {
  if (map.value?.getLayer('radius-fill')) map.value.setPaintProperty('radius-fill', 'fill-opacity', fill)
  if (map.value?.getLayer('radius-line')) map.value.setPaintProperty('radius-line', 'line-opacity', line)
}

// Dibuja la circunferencia del radio centrada en el usuario, encuadra a ella y
// la desvanece tras un par de segundos (feedback del área seleccionada).
const showRadius = (center, radiusKm) => {
  if (!map.value || !center) return
  const poly = circlePolygon(center, radiusKm)

  if (!map.value.getSource(RADIUS_SOURCE)) {
    map.value.addSource(RADIUS_SOURCE, { type: 'geojson', data: poly })
    const beforeId = map.value.getLayer(SPOTS_HALO_LAYER) ? SPOTS_HALO_LAYER : undefined
    map.value.addLayer(
      {
        id: 'radius-fill',
        type: 'fill',
        source: RADIUS_SOURCE,
        paint: { 'fill-color': getPrimaryColor(), 'fill-opacity': 0.08 },
      },
      beforeId,
    )
    map.value.addLayer(
      {
        id: 'radius-line',
        type: 'line',
        source: RADIUS_SOURCE,
        paint: { 'line-color': getPrimaryColor(), 'line-width': 2, 'line-opacity': 0.9 },
      },
      beforeId,
    )
  } else {
    map.value.getSource(RADIUS_SOURCE).setData(poly)
    setRadiusOpacity(0.08, 0.9)
  }

  const bounds = new maplibregl.LngLatBounds()
  poly.geometry.coordinates[0].forEach((c) => bounds.extend(c))
  map.value.fitBounds(bounds, { padding: 60, duration: 700 })

  clearTimeout(radiusTimer)
  radiusTimer = setTimeout(() => setRadiusOpacity(0, 0), 2000)
}

defineExpose({
  centerOnUser,
  fitToSpots,
  showRadius,
})

// `SpotsView` está cacheada por <KeepAlive>, así que al salir de ella no se
// desmonta nada: `onUnmounted` no llegaba nunca y el GPS seguía corriendo de
// fondo mientras se navegaba por el detalle o el perfil.
onDeactivated(() => {
  locationService.stopTracking()
})

onActivated(() => {
  followUser()
})

onUnmounted(() => {
  if (observer) observer.disconnect()
  clearTimeout(radiusTimer)
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

</style>
