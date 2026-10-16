import { api, unwrap, unwrapList } from '@/core/api'
import { API_ENDPOINTS } from '@/core/config/api.config'

export const profileApi = {
  /**
   * Spots creados por el usuario, incluidos los pendientes de revisión o
   * rechazados (traen `status_name` e `is_active`). Responde un array plano.
   */
  async getMySpots() {
    const response = await api.get(API_ENDPOINTS.SPOTS.MINE)
    return unwrapList(response)
  },

  /** Spots favoritos. Paginado; cada item envuelve el spot en `spot`. */
  async getFavoriteSpots() {
    const response = await api.get(API_ENDPOINTS.SPOTS.FAVORITES)
    return unwrapList(response)
      .map((item) => item.spot)
      .filter(Boolean)
  },

  /** Rutas favoritas. Paginado; cada item envuelve la ruta en `route`. */
  async getFavoriteRoutes() {
    const response = await api.get(API_ENDPOINTS.ROUTES.FAVORITES)
    return unwrapList(response)
      .map((item) => item.route)
      .filter(Boolean)
  },

  /** Quita una ruta de favoritos. */
  async removeFavoriteRoute(spotId, routeId) {
    await api.post(API_ENDPOINTS.ROUTES.REMOVE_FAVORITE(spotId, routeId))
  },

  /** Cambia la foto de perfil del usuario autenticado. */
  async updateAvatar(file) {
    const form = new FormData()
    form.append('profile_thum_path', file)
    const response = await api.patchForm(API_ENDPOINTS.USERS.PROFILE_THUMB, form)
    return unwrap(response)
  },

  /** Quita un spot de favoritos (soft delete en backend). */
  async removeFavoriteSpot(spotId) {
    await api.delete(API_ENDPOINTS.SPOTS.FAVORITE(spotId))
  },

  /**
   * Actualiza los datos editables del usuario (nombre, apellido, username).
   * @param {number|string} userId
   * @param {{ first_name?: string, last_name?: string, username?: string }} payload
   */
  async updateProfile(userId, payload) {
    const response = await api.patch(API_ENDPOINTS.USERS.PROFILE(userId), payload)
    return unwrap(response)
  },

  /**
   * Solicita el cambio de correo. El backend envía un email de confirmación;
   * el correo NO cambia hasta que el usuario confirma desde ese email.
   * @param {{ email: string, password: string }} payload
   */
  async requestEmailChange(payload) {
    const response = await api.post(API_ENDPOINTS.USERS.EMAIL_CHANGE, payload)
    return unwrap(response)
  },
}
