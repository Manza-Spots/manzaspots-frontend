import { api } from '@/core/api'
import { API_ENDPOINTS } from '@/core/config/api.config'

export const authApi = {
  /**
   * Login con email y password
   * @param {Object} credentials - {email, password}
   * @returns {Promise<Object>} {access, refresh, user}
   */
  async login(credentials) {
    const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, credentials)

    return response.data.data
  },

  /**
   * Registro de nuevo usuario
   * @param {Object} userData - {username, email, password, confirm_password}
   * @returns {Promise<Object>} {access, refresh, user}
   */
  async register(userData) {
    const response = await api.post(API_ENDPOINTS.AUTH.REGISTER, {
      username: userData.username,
      email: userData.email,
      password: userData.password,
      confirm_password: userData.confirmPassword,
    })
    return response.data.data
  },

  /**
   * Obtener información del usuario actual
   * @returns {Promise<Object>} User data
   */
  async getCurrentUser() {
    const response = await api.get(API_ENDPOINTS.AUTH.USER)
    return response.data.data
  },

  /**
   * Cerrar sesión
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      await api.post(API_ENDPOINTS.AUTH.LOGOUT)
    } catch (error) {
      console.warn('Logout error:', error)
    }
  },

  /**
   * Refrescar access token usando refresh token
   * @param {string} refreshToken
   * @returns {Promise<Object>} {access, refresh}
   */
  async refreshToken(refreshToken) {
    const response = await api.post(API_ENDPOINTS.AUTH.REFRESH, {
      refresh: refreshToken,
    })
    return response.data.data
  },

  /**
   * Verificar email con token
   * @param {string} token - Token de verificación
   * @returns {Promise<Object>}
   */
  async verifyEmail(token) {
    const response = await api.get(API_ENDPOINTS.AUTH.VERIFY_EMAIL, {
      params: { token }
    })
    return response.data.data
  },

  /**
   * Reenviar email de verificación
   * @param {string} email
   * @returns {Promise<Object>}
   */
  async resendVerificationEmail(email) {
    const response = await api.post(API_ENDPOINTS.AUTH.RESEND_EMAIL, { email })
    return response.data.data
  },

  /**
   * Solicitar reset de contraseña
   * @param {string} email
   * @returns {Promise<Object>}
   */
  async requestPasswordReset(email) {
    const response = await api.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, { email })
    return response.data.data
  },

  /**
   * Confirmar reset de contraseña
   * @param {Object} data - {uid, token, new_password, confirm_new_password}
   * @returns {Promise<Object>}
   */
  async confirmPasswordReset(data) {
    const response = await api.post(API_ENDPOINTS.AUTH.RESET_PASSWORD_CONFIRM, data)
    return response.data.data
  },

  /**
   * Cambiar contraseña (usuario autenticado)
   * @param {Object} data - {old_password, new_password1, new_password2}
   * @returns {Promise<Object>}
   */
  async changePassword(data) {
    const response = await api.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, data)
    return response.data.data
  },
}
