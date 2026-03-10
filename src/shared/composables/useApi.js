import { ref } from 'vue'

export function useApi() {
  const loading = ref(false)
  const error = ref(null)
  const data = ref(null)

  const execute = async (requestFn) => {
    loading.value = true
    error.value = null
    data.value = null

    try {
      const response = await requestFn()
      data.value = response.data
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const reset = () => {
    loading.value = false
    error.value = null
    data.value = null
  }

  return {
    loading,
    error,
    data,
    execute,
    reset,
  }
}
