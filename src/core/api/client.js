import axios from 'axios'

import { useAuthStore } from '@/features/auth/store'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()

    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

apiClient.interceptors.response.use(
  (responde) => {
    return responde
  },
  async (error) => {
    const authStore = useAuthStore()

    if (error.response?.status === 401) {
      authStore.logout()
      window.location.href = '/login'
    }

    const errorMessage = error.response?.data?.message || error.message || 'Error desconocido'

    return Promise.reject({
      message: errorMessage,
      status: error.response?.status,
      data: error.response?.data,
    })
  }
)
