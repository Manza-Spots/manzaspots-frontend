import { ref, onActivated, onDeactivated, onMounted, onUnmounted } from 'vue'

/**
 * Registro de "cómo se recarga la vista actual".
 *
 * Los tres disparadores de recarga —tirar hacia abajo, volver del segundo
 * plano y recuperar la conexión— necesitan lo mismo: saber qué recargar.
 * Cada vista registra aquí su función y los disparadores sólo la invocan,
 * en vez de que cada uno conozca las vistas.
 */

const activeLoader = ref(null)
const refreshing = ref(false)

/**
 * @param {() => Promise<void>} loader recarga de la vista que lo llama.
 */
export function useRefreshable(loader) {
  const register = () => {
    activeLoader.value = loader
  }
  const unregister = () => {
    // Sólo se desregistra a sí misma: si otra vista ya tomó el relevo, no
    // debe borrar su registro.
    if (activeLoader.value === loader) activeLoader.value = null
  }

  onMounted(register)
  onUnmounted(unregister)
  // Vistas cacheadas por KeepAlive (p. ej. Spots) no montan al volver.
  onActivated(register)
  onDeactivated(unregister)

  return { refreshing }
}

/**
 * Recarga la vista activa. Ignora llamadas concurrentes.
 * @returns {Promise<boolean>} si llegó a recargar algo.
 */
export async function triggerRefresh() {
  if (!activeLoader.value || refreshing.value) return false

  refreshing.value = true
  try {
    await activeLoader.value()
    return true
  } catch (error) {
    console.warn('Fallo al recargar la vista:', error)
    return false
  } finally {
    refreshing.value = false
  }
}

export function useRefreshState() {
  return { refreshing }
}
