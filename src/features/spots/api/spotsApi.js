import { api } from '@/core/api'
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
}
