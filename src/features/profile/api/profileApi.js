import { api } from '@/core/api'

// Desenvuelve la envoltura StandardJSONRenderer ({ data }) y, si viene
// paginado, extrae `results`. Devuelve siempre un array.
function unwrapList(response) {
  const payload = response.data?.data
  if (Array.isArray(payload)) return payload
  return payload?.results ?? []
}

export const profileApi = {
  /** Spots creados por el usuario. `/spots/my_spots/` responde un array plano. */
  async getMySpots() {
    const response = await api.get('/spots/my_spots/')
    return unwrapList(response)
  },

  /** Spots favoritos. Paginado; cada item envuelve el spot en `spot`. */
  async getFavoriteSpots() {
    const response = await api.get('/spots/favorites/')
    return unwrapList(response)
      .map((item) => item.spot)
      .filter(Boolean)
  },

  /** Rutas favoritas. Paginado; cada item envuelve la ruta en `route`. */
  async getFavoriteRoutes() {
    const response = await api.get('/routes/favorites/')
    return unwrapList(response)
      .map((item) => item.route)
      .filter(Boolean)
  },
}
