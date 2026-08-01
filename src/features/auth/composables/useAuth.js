import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store'
import { authApi } from '../api/authApi'
import { useToast } from '@/shared/composables/useToast'
import { Capacitor } from '@capacitor/core'
import { GoogleSignIn } from '@capawesome/capacitor-google-sign-in'
import { googleOneTap } from 'vue3-google-login'

export function useAuth() {
  const authStore = useAuthStore()
  const router = useRouter()
  const toast = useToast()

  const isNative = Capacitor.isNativePlatform()

  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const user = computed(() => authStore.user)
  const loading = computed(() => authStore.loading)
  const registrationEmail = computed(() => authStore.registrationEmail)

  async function login(credentials, redirectTo = '/') {
    try {
      await authStore.login(credentials)

      const redirect = router.currentRoute.value.query.redirect || redirectTo
      router.replace(redirect)

      return true
    } catch (error) {
      console.error('Login failed:', error)

      if (!error.fieldErrors) {
        toast.error(error.message || 'Error al iniciar sesión')
      }

      throw error
    }
  }


  async function webGoogleLogin(redirectTo = '/') {
    try {
      const response = await googleOneTap()
      console.log('[webGoogleLogin response]', response)

      const idToken = response?.credential

      if (!idToken) {
        throw new Error('No se recibió id_token de Google')
      }

      await authStore.googleLogin({
        id_token: idToken
      })

      const redirect = router.currentRoute.value.query.redirect || redirectTo

      router.replace(redirect)

      return true;
    } catch (error) {
      console.error('Login Google web failed:', error)
      throw error
    }
  }

  async function nativeGoogleLogin(redirectTo = '/') {
    try {
      // Según la documentación oficial de @capawesome/capacitor-google-sign-in:
      // El clientId debe ser el Web Client ID en TODAS las plataformas.
      // En Android, el plugin lo pasa como serverClientId al Credential Manager.
      // En iOS, se usa directamente para la autenticación.
      await GoogleSignIn.initialize({
        clientId: import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID,
      })

      const result = await GoogleSignIn.signIn()
      const idToken = result?.idToken

      if (!idToken) {
        throw new Error('No se recibió id_token de Google')
      }

      await authStore.googleLogin({
        id_token: idToken
      })

      const redirect = router.currentRoute.value.query.redirect || redirectTo
      router.replace(redirect)
      return true;
    } catch (error) {
      console.error('Native Login Google failed:', error)

      if (error && error.code !== 'SIGN_IN_CANCELED') {
        toast.error('Error al iniciar sesión con Google')
      }
      throw error
    }
  }

  async function register(userData, redirectTo = '/email-verified') {
    try {
      const normalizeUserData = {
        ...userData,
        email: userData.email.toLowerCase()
      }
      await authStore.register(normalizeUserData)

      toast.info(`Revisa tu correo para activar tu cuenta`, {
        duration: 5000,
        closable: false
      })

      router.replace(redirectTo)

      return true
    } catch (error) {
      if (error.fieldErrors) {
        throw error
      }

      toast.error(error.message || 'Error al registrarse')

      throw error
    }
  }

  async function requestPasswordReset(email) {
    try {
      await authStore.requestPasswordReset(email)
      return true
    } catch (error) {
      if (error.fieldErrors) {
        throw error
      }
      toast.error(error.message || 'Error al recuperar contraseña')
      throw error
    }
  }

  async function confirmPasswordReset(data) {
    try {
      await authStore.confirmPasswordReset(data)
      return true
    } catch (error) {
      if (error.fieldErrors) {
        throw error
      }
      toast.error(error.message || 'Error al restablecer contraseña')
      throw error
    }
  }

  async function verifyEmail(tokenStr) {
    try {
      await authStore.verifyEmail(tokenStr)
      return true
    } catch (error) {
      if (error.fieldErrors) throw error
      toast.error(error.message || 'Error al validar correo.')
      throw error
    }
  }

  async function resendVerificationEmail(email) {
    try {
      await authStore.resendVerificationEmail(email)
      toast.success('Correo de verificación reenviado exitosamente.')
      return true
    } catch (error) {
      if (error.fieldErrors) throw error
      toast.error(error.message || 'Error al reenviar correo.')
      throw error
    }
  }

  async function logout() {
    try {
      await authStore.logout()
      router.replace('/profile')
    } catch (error) {
      console.error('Logout error:', error)
      router.replace('/profile')
    }
  }

  // Refresca los datos del usuario (/me) de forma segura: ante un error
  // transitorio NO cierra sesión (a diferencia del fetchUser del store).
  async function refreshUser() {
    try {
      const data = await authApi.getCurrentUser()
      await authStore.setUser(data)
      return data
    } catch (error) {
      console.warn('No se pudo refrescar el perfil:', error)
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
    isNative,
    isAuthenticated,
    user,
    loading,
    registrationEmail,
    login,

    webGoogleLogin,
    nativeGoogleLogin,
    register,
    requestPasswordReset,
    confirmPasswordReset,
    verifyEmail,
    resendVerificationEmail,
    logout,
    refreshUser,
    hasPermission,
    hasRole,
    isEmailVerified
  }
}
