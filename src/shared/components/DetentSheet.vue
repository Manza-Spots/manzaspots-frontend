<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: {
    type: Number,
    default: 0,
  },

  detents: {
    type: Array,
    default: () => ['header', 0.6, 0.89],
  },

  headerOffset: {
    type: Number,
    default: 0,
  },

  topInset: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['update:modelValue', 'height'])

const rootEl = ref(null)
const sheetEl = ref(null)
const grabberEl = ref(null)
const subheaderEl = ref(null)
const footerEl = ref(null)

const hostHeight = ref(0)
const headerHeight = ref(0)
const subheaderHeight = ref(0)
const footerHeight = ref(0)
const dragging = ref(false)

const offset = ref(0)

let startY = 0
let startOffset = 0
let pointerId = null
let lastY = 0
let lastT = 0
let velocity = 0
let moved = 0
let downAt = 0

const TAP_SLOP = 12
const TAP_MS = 350

const FLICK = 0.45

const detentPx = computed(() => {
  const ceiling = Math.max(hostHeight.value - props.topInset, 0)
  return props.detents.map((d) => {
    const px =
      d === 'header'
        ? headerHeight.value + footerHeight.value + props.headerOffset
        : d * hostHeight.value
    return Math.min(px, ceiling)
  })
})

const fullPx = computed(() => Math.max(...detentPx.value))

const offsetFor = (i) => fullPx.value - (detentPx.value[i] ?? 0)

const visiblePx = computed(() => fullPx.value - offset.value)

const atLowest = computed(() => visiblePx.value <= (detentPx.value[0] ?? 0) + 2)

const maxOffset = computed(() => offsetFor(0))

const sheetStyle = computed(() => ({
  height: `${fullPx.value}px`,
  transform: `translate3d(0, ${offset.value}px, 0)`,
  transition: dragging.value
    ? 'none'
    : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
  willChange: dragging.value ? 'transform' : 'auto',
}))

const visibleHeight = () => Math.round(fullPx.value - offset.value)

const footerStyle = computed(() => ({
  transform: `translate3d(0, ${-offset.value}px, 0)`,
}))

const bodyStyle = computed(() => {
  const slice = (detentPx.value[props.modelValue] ?? 0) - headerHeight.value - subheaderHeight.value
  return {
    height: `${Math.max(slice, 0)}px`,

    paddingBottom: `${footerHeight.value}px`,
  }
})

const settleTo = (index) => {
  const i = Math.min(Math.max(index, 0), props.detents.length - 1)
  offset.value = offsetFor(i)
  if (i !== props.modelValue) emit('update:modelValue', i)
  emit('height', visibleHeight())
}

const nearestIndex = () => {
  let best = 0
  let bestDist = Infinity
  detentPx.value.forEach((_, i) => {
    const d = Math.abs(offsetFor(i) - offset.value)
    if (d < bestDist) {
      bestDist = d
      best = i
    }
  })
  return best
}

function onDown(e) {
  pointerId = e.pointerId
  startY = e.clientY
  lastY = e.clientY
  lastT = e.timeStamp
  startOffset = offset.value
  velocity = 0
  moved = 0
  downAt = e.timeStamp
  dragging.value = true

  window.addEventListener('pointermove', onMove, true)

  window.addEventListener('pointerup', onUp, true)
  window.addEventListener('pointercancel', onUp, true)

  try {
    sheetEl.value?.setPointerCapture(pointerId)
  } catch (unsupported) {
    void unsupported
  }
}

function onMove(e) {
  if (e.pointerId !== pointerId) return

  const dy = e.clientY - startY
  moved = Math.max(moved, Math.abs(dy))

  const dt = e.timeStamp - lastT
  if (dt > 0) velocity = (e.clientY - lastY) / dt
  lastY = e.clientY
  lastT = e.timeStamp

  let next = startOffset + dy

  if (next < 0) next = 0

  else if (next > maxOffset.value) next = maxOffset.value + (next - maxOffset.value) / 3

  offset.value = next
}

function endGesture() {
  window.removeEventListener('pointermove', onMove, true)
  window.removeEventListener('pointerup', onUp, true)
  window.removeEventListener('pointercancel', onUp, true)
  pointerId = null
  dragging.value = false
}

function onUp(e) {
  if (e && e.pointerId !== pointerId) return

  endGesture()

  if (moved < TAP_SLOP && e && e.timeStamp - downAt < TAP_MS) {
    settleTo((props.modelValue + 1) % props.detents.length)
    return
  }

  if (Math.abs(velocity) > FLICK) {
    const dir = velocity > 0 ? -1 : 1
    settleTo(props.modelValue + dir)
    return
  }

  settleTo(nearestIndex())
}

const measure = () => {
  hostHeight.value = rootEl.value?.parentElement?.clientHeight || window.innerHeight
  headerHeight.value = grabberEl.value?.offsetHeight || 0
  subheaderHeight.value = subheaderEl.value?.offsetHeight || 0
  footerHeight.value = footerEl.value?.offsetHeight || 0
  offset.value = offsetFor(props.modelValue)
  emit('height', visibleHeight())
}

watch(
  () => props.modelValue,
  (i) => {
    if (dragging.value) endGesture()
    offset.value = offsetFor(i)
    emit('height', visibleHeight())
  },
)

const onHidden = () => {
  if (document.hidden && dragging.value) {
    endGesture()
    offset.value = offsetFor(props.modelValue)
  }
}

let headerObserver = null

onMounted(() => {
  measure()
  window.addEventListener('resize', measure)
  document.addEventListener('visibilitychange', onHidden)

  headerObserver = new ResizeObserver(measure)
  if (grabberEl.value) headerObserver.observe(grabberEl.value)
  if (subheaderEl.value) headerObserver.observe(subheaderEl.value)
  if (footerEl.value) headerObserver.observe(footerEl.value)

  if (rootEl.value?.parentElement) headerObserver.observe(rootEl.value.parentElement)
})

onUnmounted(() => {
  headerObserver?.disconnect()
  window.removeEventListener('resize', measure)
  document.removeEventListener('visibilitychange', onHidden)
  window.removeEventListener('pointermove', onMove, true)
  window.removeEventListener('pointerup', onUp, true)
  window.removeEventListener('pointercancel', onUp, true)
})

defineExpose({ visibleHeight })
</script>

<template>
  <div ref="rootEl" class="detent-root">
    <div ref="sheetEl" class="sheet" :style="sheetStyle">
      <div ref="grabberEl" class="grabber" @pointerdown="onDown">
        <span class="grabber-bar"></span>
        <slot name="header"></slot>
      </div>

      <div v-if="$slots.subheader" ref="subheaderEl" class="subheader">
        <slot name="subheader"></slot>
      </div>

      <div class="body" :class="{ 'is-locked': atLowest }" :style="bodyStyle">
        <slot></slot>
      </div>

      <div v-if="$slots.footer" ref="footerEl" class="footer" :style="footerStyle">
        <slot name="footer"></slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
.detent-root {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 20;
}

.sheet {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
  border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  pointer-events: auto;
}

.grabber {
  flex: none;
  padding-top: var(--space-3);
  cursor: grab;

  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.grabber-bar {
  display: block;
  width: 46px;
  height: 5px;
  margin: 0 auto;
  border-radius: var(--radius-full);
  background: var(--color-border-hover);
}

.body {
  flex: none;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.body.is-locked {
  overflow: hidden;
  visibility: hidden;
}

.subheader {
  flex: none;
}

.footer {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
  background: var(--color-bg);
}
</style>
