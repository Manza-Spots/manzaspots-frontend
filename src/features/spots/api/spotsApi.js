import { api, unwrap, unwrapList } from '@/core/api'
import { API_ENDPOINTS } from '@/core/config/api.config'

export const spotsApi = {
  /**
   * Lista de spots. El endpoint es público (no requiere auth).
   * El backend envuelve la respuesta con StandardJSONRenderer en
   * `{ success, data, ... }` y pagina con PageNumberPagination
   * (`{ count, next, previous, results }`), así que la lista real vive en
   * `response.data.data.results`.
   * @param {Object} [params] query params (filtros/paginación)
   * @returns {Promise<Array>} spots crudos del backend
   */
  async getSpots(params = {}) {
    const response = await api.get(API_ENDPOINTS.SPOTS.LIST, { params })
    const payload = response.data?.data
    // Paginado -> { results: [...] }; fallback a array directo por robustez.
    return payload?.results ?? (Array.isArray(payload) ? payload : [])
  },

  async getSpot(id) {
    const response = await api.get(API_ENDPOINTS.SPOTS.DETAIL(id))
    return response.data?.data ?? response.data
  },

  async getSpotRoutes(id) {
    const response = await api.get(API_ENDPOINTS.SPOTS.ROUTES(id))
    const payload = response.data?.data
    const all = payload?.results ?? (Array.isArray(payload) ? payload : [])
    return all.filter((route) => String(route.spot) === String(id))
  },

  async addFavorite(id) {
    await api.post(API_ENDPOINTS.SPOTS.FAVORITE(id))
  },

  async removeFavorite(id) {
    await api.delete(API_ENDPOINTS.SPOTS.FAVORITE(id))
  },

  /**
   * Propone un spot nuevo. Queda pendiente de revisión hasta que un admin lo apruebe.
   * @param {{ name: string, description: string, file: File, location: object }} data
   *   `location` es un GeoJSON Point.
   */
  async createSpot({ name, description, file, location }) {
    const form = new FormData()
    form.append('name', name)
    form.append('description', description)
    form.append('spot_thumbnail_path', file)
    form.append('location', JSON.stringify(location))
    const response = await api.postForm(API_ENDPOINTS.SPOTS.CREATE, form)
    return unwrap(response)
  },

  /** Agrega una foto a la galería del spot. */
  async addPhoto(spotId, { file, description = '' }) {
    const form = new FormData()
    form.append('img_path', file)
    if (description) form.append('description', description)
    const response = await api.postForm(API_ENDPOINTS.SPOTS.CAPTIONS(spotId), form)
    return unwrap(response)
  },

  // ─── Moderación (solo staff) ──────────────────────────────────────────────

  async getPendingSpots() {
    const response = await api.get(API_ENDPOINTS.SPOTS.LIST, { params: { status: 'PENDING' } })
    return unwrapList(response)
  },

  async authorizeSpot(id) {
    const response = await api.post(API_ENDPOINTS.SPOTS.AUTHORIZE(id))
    return unwrap(response)
  },

  async denySpot(id, reason) {
    const response = await api.post(API_ENDPOINTS.SPOTS.DENY(id), { reason })
    return unwrap(response)
  },
}
