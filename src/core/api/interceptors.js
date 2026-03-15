import { useAuthStore } from '@/features/auth/store'
import { errorHandler } from './errorHandler'
import { HTTP_STATUS } from '@/core/config/api.config'

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })

  failedQueue = []
}

export const setupInterceptors = (axiosInstance) => {
  axiosInstance.interceptors.request.use(
    (config) => {
      const authStore = useAuthStore()

      if (authStore.token) {
        config.headers.Authorization = `Bearer ${authStore.token}`
      }

      if (import.meta.env.DEV) {
        console.log('Request:', config.method.toUpperCase(), config.url)
      }

      return config
    },
    (error) => {
      if (import.meta.env.DEV) {
        console.error('Request error:', error)
      }
      return Promise.reject(error)
    }
  )

  axiosInstance.interceptors.response.use(
    (response) => {
      if (import.meta.env.DEV) {
        console.log('Response:', response.config.url, response.status)
      }
      return response
    },
    async (error) => {
      const originalRequest = error.config

      if (import.meta.env.DEV) {
        console.error('Response error:', error.response?.status, error.response?.data)
      }

      // Si es error 401 y no es la ruta de login/refresh
      if (
        error.response?.status === HTTP_STATUS.UNAUTHORIZED &&
        !originalRequest._retry &&
        !originalRequest.url.includes('/auth/login') &&
        !originalRequest.url.includes('/auth/token/refresh')
      ) {
        const authStore = useAuthStore()

        if (authStore.refreshToken) {
          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject })
            })
              .then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`
                return axiosInstance(originalRequest)
              })
              .catch((err) => {
                return Promise.reject(err)
              })
          }

          originalRequest._retry = true
          isRefreshing = true

          try {
            const response = await authStore.refreshAccessToken()
            const { access } = response

            processQueue(null, access)

            originalRequest.headers.Authorization = `Bearer ${access}`
            return axiosInstance(originalRequest)
          } catch (refreshError) {
            processQueue(refreshError, null)
            authStore.logout()
            window.location.href = '/login'
            return Promise.reject(refreshError)
          } finally {
            isRefreshing = false
          }
        } else {
          authStore.logout()
          window.location.href = '/login'
        }
      }

      const apiError = errorHandler.handle(error)
      return Promise.reject(apiError)
    }
  )

  return axiosInstance
}
