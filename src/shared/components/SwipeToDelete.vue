<script setup>
import { ref, computed } from 'vue'
import Icon from './Icon.vue'

const props = defineProps({
  // Texto por defecto del fondo revelado.
  label: {
    type: String,
    default: 'Eliminar',
  },
  // Texto cuando el gesto pasó el umbral (soltar = confirmar).
  armedLabel: {
    type: String,
    default: 'Eliminar',
  },
  // Proporción del ancho que hay que deslizar para confirmar (0–1).
  threshold: {
    type: Number,
    default: 0.45,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['delete'])

const rootEl = ref(null)
const fgEl = ref(null)

const translateX = ref(0)
const dragging = ref(false)
const committing = ref(false)

// Estado no reactivo del gesto en curso.
let startX = 0
let startY = 0
let width = 0
let locked = false
let axisDecided = false
let pointerId = null

const thresholdPx = () => Math.min(Math.max(width * props.threshold, 90), width * 0.8)

const armed = computed(() => -translateX.value >= thresholdPx())

const fgStyle = computed(() => ({
  transform: `translate3d(${translateX.value}px, 0, 0)`,
  transition: dragging.value ? 'none' : 'transform 0.24s cubic-bezier(0.22, 0.61, 0.36, 1)',
}))

function onDown(e) {
  if (props.disabled || committing.value) return
  width = rootEl.value?.offsetWidth || 0
  startX = e.clientX
  startY = e.clientY
  locked = false
  axisDecided = false
  pointerId = e.pointerId
}

function onMove(e) {
  if (props.disabled || committing.value || pointerId === null) return

  const dx = e.clientX - startX
  const dy = e.clientY - startY

  if (!axisDecided) {
    if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return
    axisDecided = true
    // Solo capturamos el gesto si es predominantemente horizontal hacia la izquierda.
    if (Math.abs(dx) > Math.abs(dy)) {
      locked = true
      dragging.value = true
      try {
        fgEl.value?.setPointerCapture(pointerId)
      } catch {
        // Ignorado: algunos navegadores rechazan capturar si el puntero ya se soltó.
      }
    } else {
      // Gesto vertical: dejamos que la lista haga scroll.
      locked = false
    }
  }

  if (!locked) return

  let tx = dx
  if (tx > 0) tx = 0
  if (tx < -width) tx = -width
  translateX.value = tx
}

function reset() {
  locked = false
  axisDecided = false
  pointerId = null
}

function onUp() {
  if (!locked) {
    reset()
    return
  }
  dragging.value = false

  if (-translateX.value >= thresholdPx()) {
    commit()
  } else {
    translateX.value = 0
  }
  reset()
}

function commit() {
  committing.value = true
  translateX.value = -width
  window.setTimeout(() => emit('delete'), 200)
}
</script>

<template>
  <div ref="rootEl" class="s2d">
    <div class="s2d-bg" :class="{ armed }">
      <div class="s2d-bg-inner">
        <Icon name="Trash2" :size="20" />
        <span class="s2d-label">{{ armed ? armedLabel : label }}</span>
      </div>
    </div>

    <div
      ref="fgEl"
      class="s2d-fg"
      :style="fgStyle"
      @pointerdown="onDown"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointercancel="onUp"
    >
      <slot />
    </div>
  </div>
</template>

<style scoped>
.s2d {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-xl);
}

.s2d-bg {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: var(--space-5);
  background: var(--color-coral);
  color: #fff;
  transition: background var(--transition-fast);
}

.s2d-bg.armed {
  background: var(--color-coral-deep);
}

.s2d-bg-inner {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
  transform: scale(1);
  transition: transform var(--transition-fast);
}

.s2d-bg.armed .s2d-bg-inner {
  transform: scale(1.12);
}

.s2d-label {
  white-space: nowrap;
}

.s2d-fg {
  position: relative;
  touch-action: pan-y;
  user-select: none;
  -webkit-user-select: none;
  will-change: transform;
}
</style>
