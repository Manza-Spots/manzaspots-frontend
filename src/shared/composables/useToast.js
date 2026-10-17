import { ref } from 'vue'

const toasts = ref([])
const timers = new Map()
let toastId = 0

export function useToast() {
  const schedule = (toast) => {
    clearTimeout(timers.get(toast.id))
    if (toast.duration > 0) timers.set(toast.id, setTimeout(() => remove(toast.id), toast.duration))
  }

  const add = (options) => {
    const message = options.message || ''
    const variant = options.variant || 'info'

    // Varias peticiones que fallan a la vez dan el mismo aviso: se muestra uno
    // solo y se alarga su tiempo en pantalla en vez de apilar copias.
    const same = toasts.value.find((t) => t.message === message && t.variant === variant)
    if (same) {
      schedule(same)
      return same.id
    }

    const toast = {
      id: toastId++,
      message,
      variant,
      duration: options.duration ?? 3000,
      closable: options.closable !== false,
    }

    toasts.value.push(toast)
    schedule(toast)
    return toast.id
  }

  const remove = (id) => {
    clearTimeout(timers.get(id))
    timers.delete(id)
    const index = toasts.value.findIndex((t) => t.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  const clear = () => {
    timers.forEach(clearTimeout)
    timers.clear()
    toasts.value = []
  }

  // Helpers
  const success = (message, options = {}) => {
    return add({ ...options, message, variant: 'success' })
  }

  const error = (message, options = {}) => {
    return add({ ...options, message, variant: 'error' })
  }

  const warning = (message, options = {}) => {
    return add({ ...options, message, variant: 'warning' })
  }

  const info = (message, options = {}) => {
    return add({ ...options, message, variant: 'info' })
  }

  return {
    toasts,
    add,
    remove,
    clear,
    success,
    error,
    warning,
    info,
  }
}
