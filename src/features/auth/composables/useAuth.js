import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store'
import { useToast } from '@/shared/composables/useToast'

export function useAuth() {
  const authStore = useAuthStore()
  const router = useRouter()
  const toast = useToast()

  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const user = computed(() => authStore.user)
  const loading = computed(() => authStore.loading)

  async function login(credentials, redirectTo = '/') {
    try {
      await authStore.login(credentials)

      toast.success(`¡Bienvenido de vuelta, ${authStore.userName}!`)

      const redirect = router.currentRoute.value.query.redirect || redirectTo
      router.replace(redirect)

      return true
    } catch (error) {
      console.error('Login failed:', error)

      throw error
    }
  }

  async function register(userData, redirectTo = '/') {
    try {
      await authStore.register(userData)
      toast.success(`¡Bienvenido, ${authStore.userName}! Tu cuenta ha sido creada.`)

      router.replace(redirectTo)

      return true
    } catch (error) {
      console.error('Register failed:', error)

      if (error.status === 400 || error.status === 422) {
        if (error.data?.email) {
          toast.error('Este email ya está registrado')
        }
      }

      throw error
    }
  }

  async function logout() {
    try {
      await authStore.logout()

      toast.info('Sesión cerrada correctamente')

      router.replace('/login')
    } catch (error) {
      console.error('Logout error:', error)
      router.replace('/login')
    }
  }

  function hasRole(role) {
    return user.value?.role === role
  }

  function hasPermission(permission) {
    return user.value?.permissions?.includes(permission)
  }

  function isEmailVerified() {
    return user.value?.email_verified === true
  }

  return {
    // State
    isAuthenticated,
    user,
    loading,

    // Methods
    login,
    register,
    logout,
    hasPermission,
    hasRole,
    isEmailVerified,
  }
}
