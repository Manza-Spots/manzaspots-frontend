import { ref } from 'vue'

const toasts = ref([])
let toastId = 0

export function useToast() {
  const add = (options) => {
    const id = toastId++

    const toast = {
      id,
      message: options.message || '',
      variant: options.variant || 'info',
      duration: options.duration || 3000,
      closable: options.closable !== false,
    }

    toasts.value.push(toast)

    if (toast.duration > 0) {
      setTimeout(() => {
        remove(id)
      }, toast.duration)
    }

    return id
  }

  const remove = (id) => {
    const index = toasts.value.findIndex((t) => t.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  const clear = () => {
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
