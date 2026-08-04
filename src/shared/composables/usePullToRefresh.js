import { ref, computed } from 'vue'

const THRESHOLD = 70
const MAX_PULL = 110
// El arrastre se traduce a un recorrido menor: da sensación de resistencia
// y evita que el indicador se despegue del borde.
const RESISTANCE = 0.5
const AXIS_LOCK = 8

/**
 * Tirar hacia abajo para recargar.
 *
 * El navegador no puede aportarlo: `overscroll-behavior-y: none` (main.css)
 * desactiva el rebote nativo para que la app no se sienta una web. Por eso
 * el gesto es propio, y sigue la misma disciplina que el resto de gestos de
 * la app: decidir el eje una sola vez y ceder si no es el nuestro.
 *
 * @param {object}   options
 * @param {Function} options.onRefresh    recarga a ejecutar al soltar.
 * @param {Function} [options.scrollTop]  posición de scroll actual (por
 *                   defecto la del documento). Sólo activa en el tope.
 * @param {import('vue').Ref<boolean>} [options.disabled]
 */
export function usePullToRefresh({ onRefresh, scrollTop, disabled }) {
  const distance = ref(0)
  const refreshing = ref(false)

  const getScrollTop = scrollTop || (() => window.scrollY || document.documentElement.scrollTop)

  // Estado no reactivo del gesto en curso.
  let startY = 0
  let startX = 0
  let tracking = false
  let axisDecided = false
  let pulling = false

  const armed = computed(() => distance.value >= THRESHOLD)
  const progress = computed(() => Math.min(distance.value / THRESHOLD, 1))

  const reset = () => {
    tracking = false
    axisDecided = false
    pulling = false
  }

  function onTouchStart(e) {
    if (disabled?.value || refreshing.value) return
    if (getScrollTop() > 0) return

    startY = e.touches[0].clientY
    startX = e.touches[0].clientX
    tracking = true
    axisDecided = false
    pulling = false
  }

  function onTouchMove(e) {
    if (!tracking) return

    const dy = e.touches[0].clientY - startY
    const dx = e.touches[0].clientX - startX

    if (!axisDecided) {
      if (Math.abs(dy) < AXIS_LOCK && Math.abs(dx) < AXIS_LOCK) return
      axisDecided = true

      // Sólo nos quedamos el gesto si es vertical, hacia abajo y seguimos
      // en el tope. Si no, es scroll o un gesto horizontal: se cede.
      if (dy <= 0 || Math.abs(dx) > Math.abs(dy) || getScrollTop() > 0) {
        tracking = false
        return
      }
      pulling = true
    }

    if (!pulling) return

    // Con el gesto tomado, evitamos que el contenido scrollee a la vez.
    if (e.cancelable) e.preventDefault()
    distance.value = Math.min(dy * RESISTANCE, MAX_PULL)
  }

  async function onTouchEnd() {
    if (!pulling) {
      reset()
      return
    }
    reset()

    if (distance.value < THRESHOLD) {
      distance.value = 0
      return
    }

    // Se mantiene el indicador a la altura del umbral mientras recarga.
    refreshing.value = true
    distance.value = THRESHOLD
    try {
      await onRefresh()
    } finally {
      refreshing.value = false
      distance.value = 0
    }
  }

  return {
    distance,
    progress,
    armed,
    refreshing,
    threshold: THRESHOLD,
    handlers: {
      touchstart: onTouchStart,
      touchmove: onTouchMove,
      touchend: onTouchEnd,
      touchcancel: onTouchEnd,
    },
  }
}
