import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from './api/authApi'
import { storage } from '@/core/storage'

const TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const USER_KEY = 'user'
const REGISTRATION_EMAIL_KEY = 'registration_email'

export const useAuthStore = defineStore('auth', () => {
  // State
  const token = ref(null)
  const refreshToken = ref(null)
  const user = ref(null)
  const loading = ref(false)
  const initialized = ref(false)
  const registrationEmail = ref(null)

  // Getters
  const isAuthenticated = computed(() => !!token.value)
  const userEmail = computed(() => user.value?.email || null)
  const userName = computed(() => user.value?.name || user.value?.email || 'Usuario')

  // Actions
  async function initialize() {
    if (initialized.value) return

    try {
      loading.value = true

      const [savedToken, savedRefreshToken, savedUser, savedRegEmail] = await Promise.all([
        storage.get(TOKEN_KEY),
        storage.get(REFRESH_TOKEN_KEY),
        storage.get(USER_KEY),
        storage.get(REGISTRATION_EMAIL_KEY),
      ])

      if (savedToken) {
        token.value = savedToken
      }

      if (savedRegEmail) {
        registrationEmail.value = savedRegEmail
      }

      if (savedRefreshToken) {
        refreshToken.value = savedRefreshToken
      }

      if (savedUser) {
        user.value = savedUser
      }

      if (token.value && !user.value) {
        try {
          await fetchUser()
        } catch (error) {
          console.error('Initialize fetch user error:', error)
          await clearAuth()
        }
      }

      initialized.value = true
    } catch (error) {
      console.error('Initialize error:', error)
      initialized.value = true
    } finally {
      loading.value = false
    }
  }

  async function login(credentials) {
    loading.value = true
    try {
      const response = await authApi.login(credentials)
      await setToken(response.access)
      await setRefreshToken(response.refresh)

      if (response.user) {
        await setUser(response.user)
      } else {
        await fetchUser()
      }

      return response
    } finally {
      loading.value = false
    }
  }

  async function register(userData) {
    loading.value = true
    try {
      const response = await authApi.register(userData)

      registrationEmail.value = userData.email
      await storage.set(REGISTRATION_EMAIL_KEY, userData.email)

      return response
    } finally {
      loading.value = false
    }
  }

  async function requestPasswordReset(email) {
    loading.value = true
    try {
      const response = await authApi.requestPasswordReset(email)
      return response
    } finally {
      loading.value = false
    }
  }

  async function confirmPasswordReset(data) {
    loading.value = true
    try {
      const response = await authApi.confirmPasswordReset(data)
      return response
    } finally {
      loading.value = false
    }
  }

  async function verifyEmail(tokenStr) {
    loading.value = true
    try {
      const response = await authApi.verifyEmail(tokenStr)
      // Cleanup after success
      registrationEmail.value = null
      await storage.remove(REGISTRATION_EMAIL_KEY)
      return response
    } finally {
      loading.value = false
    }
  }

  async function resendVerificationEmail(email) {
    loading.value = true
    try {
      const targetEmail = email || registrationEmail.value
      if (!targetEmail) throw new Error('No hay un correo asociado para reeneviar.')
      const response = await authApi.resendVerificationEmail(targetEmail)
      return response
    } finally {
      loading.value = false
    }
  }

  async function fetchUser() {
    if (!token.value) return null

    try {
      const userData = await authApi.getCurrentUser()
      await setUser(userData)
      return userData
    } catch (error) {
      console.error('Fetch user error:', error)
      await logout()
      throw error
    }
  }

  async function refreshAccessToken() {
    if (!refreshToken.value) {
      throw new Error('No refresh token available')
    }

    try {
      const response = await authApi.refreshToken(refreshToken.value)

      await setToken(response.access)

      if (response.refresh) {
        await setRefreshToken(response.refresh)
      }

      return response
    } catch (error) {
      await logout()
      throw error
    }
  }

  async function logout() {
    try {
      await authApi.logout()
    } catch (error) {
      console.warn('Logout API error:', error)
    } finally {
      await clearAuth()
    }
  }

  async function clearAuth() {
    token.value = null
    refreshToken.value = null
    user.value = null
    registrationEmail.value = null

    await Promise.all([
      storage.remove(TOKEN_KEY),
      storage.remove(REFRESH_TOKEN_KEY),
      storage.remove(USER_KEY),
      storage.remove(REGISTRATION_EMAIL_KEY),
    ])
  }

  async function setToken(newToken) {
    token.value = newToken
    if (newToken) {
      await storage.set(TOKEN_KEY, newToken)
    } else {
      await storage.remove(TOKEN_KEY)
    }
  }

  async function setRefreshToken(newRefreshToken) {
    refreshToken.value = newRefreshToken
    if (newRefreshToken) {
      await storage.set(REFRESH_TOKEN_KEY, newRefreshToken)
    } else {
      await storage.remove(REFRESH_TOKEN_KEY)
    }
  }

  async function setUser(userData) {
    user.value = userData
    if (userData) {
      await storage.set(USER_KEY, userData)
    } else {
      await storage.remove(USER_KEY)
    }
  }

  function isTokenExpiringSoon() {
    if (!token.value) return false

    try {
      const payload = JSON.parse(atob(token.value.split('.')[1]))
      const exp = payload.exp * 1000
      const now = Date.now()
      const fiveMinutes = 5 * 60 * 1000

      return exp - now < fiveMinutes
    } catch (error) {
      console.log('Error isTokenExpirationSoon: ', error)
      return false
    }
  }

  return {
    // State
    token,
    refreshToken,
    user,
    loading,
    initialized,
    registrationEmail,

    // Getters
    isAuthenticated,
    userEmail,
    userName,

    // Actions
    login,
    register,
    requestPasswordReset,
    confirmPasswordReset,
    verifyEmail,
    resendVerificationEmail,
    logout,
    fetchUser,
    refreshAccessToken,
    setToken,
    setRefreshToken,
    setUser,
    clearAuth,
    initialize,
    isTokenExpiringSoon,
  }
})
