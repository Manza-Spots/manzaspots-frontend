<script setup>
import { ref, onMounted, onUnmounted, shallowRef, computed, watch } from 'vue'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

// Selector de ubicación: el pin queda fijo al centro y el usuario mueve el
// mapa debajo. El valor es siempre el centro del mapa.
const props = defineProps({
  modelValue: {
    type: Object, // { lat, lng }
    default: null,
  },
})

const emit = defineEmits(['update:modelValue'])

const DEFAULT_CENTER = [-104.316111, 19.053333]
const PICK_ZOOM = 16

const mapContainer = ref(null)
const map = shallowRef(null)
const isMoving = ref(false)

const isDarkMode = ref(false)
let observer = null

const mapStyle = computed(() =>
  isDarkMode.value
    ? 'https://tiles.openfreemap.org/styles/positron'
    : 'https://tiles.openfreemap.org/styles/liberty',
)

const emitCenter = () => {
  const { lat, lng } = map.value.getCenter()
  emit('update:modelValue', { lat, lng })
}

/** Centra el mapa (y por lo tanto el pin) en la posición dada. */
const flyTo = ({ lat, lng }) => {
  map.value?.flyTo({ center: [lng, lat], zoom: PICK_ZOOM, essential: true })
}

defineExpose({ flyTo })

onMounted(() => {
  isDarkMode.value = document.documentElement.classList.contains('dark')
  observer = new MutationObserver(() => {
    isDarkMode.value = document.documentElement.classList.contains('dark')
  })
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

  const start = props.modelValue
    ? [props.modelValue.lng, props.modelValue.lat]
    : DEFAULT_CENTER

  map.value = new maplibregl.Map({
    container: mapContainer.value,
    style: mapStyle.value,
    center: start,
    zoom: props.modelValue ? PICK_ZOOM : 12,
    pitch: 0,
    dragRotate: false,
    attributionControl: false,
  })
  map.value.touchZoomRotate.disableRotation()

  map.value.on('movestart', () => {
    isMoving.value = true
  })
  map.value.on('moveend', () => {
    isMoving.value = false
    emitCenter()
  })
  map.value.on('load', () => {
    if (props.modelValue) emitCenter()
  })
})

watch(mapStyle, (style) => map.value?.setStyle(style))

onUnmounted(() => {
  observer?.disconnect()
  map.value?.remove()
})
</script>

<template>
  <div class="picker">
    <div ref="mapContainer" class="picker-map"></div>
    <div class="picker-pin" :class="{ 'is-lifted': isMoving }" aria-hidden="true">
      <svg width="34" height="42" viewBox="0 0 48 60">
        <path
          d="M24,58 C14,42 6,34 6,22 A18,18 0 1,1 42,22 C42,34 34,42 24,58 Z"
          fill="var(--color-primary)"
          stroke="#ffffff"
          stroke-width="3"
        />
        <circle cx="24" cy="22" r="6" fill="#ffffff" />
      </svg>
      <span class="picker-shadow"></span>
    </div>
  </div>
</template>

<style scoped>
.picker {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.picker-map {
  position: absolute;
  inset: 0;
}

/* La punta del pin marca el centro exacto del mapa. */
.picker-pin {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -100%);
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: transform var(--transition-fast);
}

.picker-pin svg {
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.25));
}

.picker-pin.is-lifted {
  transform: translate(-50%, calc(-100% - 8px));
}

.picker-shadow {
  position: absolute;
  bottom: -3px;
  width: 10px;
  height: 4px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.3);
}
</style>
