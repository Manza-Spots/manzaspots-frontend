<script setup>
import { ref, computed, onUnmounted } from 'vue'
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
// El fondo rojo solo existe mientras hay gesto real (arrastre, vuelta a su
// sitio o confirmación). En reposo no se pinta nada, así que ni el scroll de
// inercia ni un gesto atascado pueden dejarlo asomando.
const revealed = ref(false)

// Estado no reactivo del gesto en curso.
let startX = 0
let startY = 0
let width = 0
let locked = false
let axisDecided = false
let pointerId = null

/**
 * Umbrales del reparto de gestos con el scroll de la lista.
 *
 * `touch-action: pan-y` deja el eje vertical al navegador y el horizontal a
 * nosotros, pero cada uno decide por su cuenta y con su propio criterio. Si los
 * dos se dan por aludidos —lo que pasa en cualquier diagonal— la lista scrollea
 * y la fila se desliza a la vez. Por eso quedarnos el gesto exige bastante más
 * que soltarlo: recorrido mayor y una dominancia horizontal clara. En la duda
 * gana el scroll, que es el gesto que el usuario hace mil veces más.
 */
const AXIS_SLOP = 10
const H_DOMINANCE = 1.4

const thresholdPx = () => Math.min(Math.max(width * props.threshold, 90), width * 0.8)

const armed = computed(() => -translateX.value >= thresholdPx())

// La capa solo se promueve a GPU mientras se mueve. En reposo (y en el scroll
// de la lista) queda sin promover, en la misma capa que el fondo, así que no
// hay desincronía de composición que deje filtrar el rojo.
const engaged = computed(() => dragging.value || committing.value)

const fgStyle = computed(() => ({
  transform: engaged.value
    ? `translate3d(${translateX.value}px, 0, 0)`
    : `translateX(${translateX.value}px)`,
  transition: dragging.value ? 'none' : 'transform 0.24s cubic-bezier(0.22, 0.61, 0.36, 1)',
  willChange: engaged.value ? 'transform' : 'auto',
}))

// Red de seguridad del gesto. `setPointerCapture` le dice al navegador que el
// puntero es nuestro, lo que suprime tanto el `pointercancel` como el scroll
// nativo que usábamos para abortar. Así que la única salida garantizada sería
// el `pointerup` sobre la fila; si ese evento se pierde (captura fallida, dedo
// soltado fuera, quirk de iOS) la fila quedaba bloqueada y armada para siempre.
// Escuchando en `window` en captura, el gesto SIEMPRE se resuelve.
function watchGesture() {
  // `scroll` no burbujea, pero en fase de captura llegan los de los ancestros.
  document.addEventListener('scroll', abort, true)
  window.addEventListener('pointerup', onGlobalUp, true)
  window.addEventListener('pointercancel', onGlobalCancel, true)
}

function unwatchGesture() {
  document.removeEventListener('scroll', abort, true)
  window.removeEventListener('pointerup', onGlobalUp, true)
  window.removeEventListener('pointercancel', onGlobalCancel, true)
}

function onGlobalUp(e) {
  if (e.pointerId === pointerId) onUp()
}

function onGlobalCancel(e) {
  if (e.pointerId === pointerId) abort()
}

function onDown(e) {
  if (props.disabled || committing.value) return
  // Un segundo dedo no secuestra un arrastre en curso. Solo se ignora si el
  // primero llegó a capturar el gesto; si no, el anterior nunca fue nuestro y
  // este pointerdown lo sustituye (el `pointerup` de un gesto sin capturar
  // puede caer fuera de la fila y no llegar nunca aquí).
  if (locked) return
  width = rootEl.value?.offsetWidth || 0
  startX = e.clientX
  startY = e.clientY
  locked = false
  axisDecided = false
  pointerId = e.pointerId
  translateX.value = 0
}

function onMove(e) {
  if (props.disabled || committing.value || pointerId === null) return

  const dx = e.clientX - startX
  const dy = e.clientY - startY

  if (!axisDecided) {
    const adx = Math.abs(dx)
    const ady = Math.abs(dy)
    if (adx < AXIS_SLOP && ady < AXIS_SLOP) return

    axisDecided = true
    // Solo hacia la izquierda: un arrastre a la derecha no descubre nada, así
    // que no hay razón para quedárselo.
    locked = dx <= -AXIS_SLOP && adx > ady * H_DOMINANCE

    if (!locked) return

    dragging.value = true
    revealed.value = true
    watchGesture()
    try {
      fgEl.value?.setPointerCapture(pointerId)
    } catch {
      // Ignorado: algunos navegadores rechazan capturar si el puntero ya se soltó.
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
  unwatchGesture()
}

/** Devuelve la fila a su sitio sin borrar nada. */
function abort() {
  dragging.value = false
  // Si ya estaba en su sitio no habrá transición que dispare `settle`, así que
  // ocultamos el fondo aquí mismo; si no, `settle` lo hará al terminar el viaje.
  const willAnimate = translateX.value !== 0
  translateX.value = 0
  reset()
  if (!willAnimate) revealed.value = false
}

// Al terminar la vuelta a su sitio, deja de pintar el fondo rojo. Solo cuando
// la fila descansa en 0 y no está confirmando un borrado.
function settle(e) {
  if (e.propertyName !== 'transform') return
  if (translateX.value === 0 && !committing.value) revealed.value = false
}

function onUp() {
  if (!locked) {
    reset()
    return
  }
  dragging.value = false

  if (-translateX.value >= thresholdPx()) {
    commit()
    reset()
    return
  }

  abort()
}

function commit() {
  committing.value = true
  translateX.value = -width
  window.setTimeout(() => emit('delete'), 200)
}

onUnmounted(unwatchGesture)
</script>

<template>
  <div ref="rootEl" class="s2d">
    <div v-show="revealed" class="s2d-bg" :class="{ armed }">
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
      @pointercancel="abort"
      @transitionend="settle"
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
  /* La promoción a GPU se aplica de forma reactiva solo durante el gesto
     (ver `fgStyle`); en reposo la fila viaja en la misma capa que el fondo. */
}
</style>
