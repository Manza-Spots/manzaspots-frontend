import { api, unwrap, unwrapList } from '@/core/api'
import { API_ENDPOINTS } from '@/core/config/api.config'

// Los catálogos casi no cambian: se piden una vez por sesión.
let difficultiesPromise = null
let travelModesPromise = null

export const routesApi = {
  /** Niveles de dificultad: [{ id, name, key, hex_color }]. */
  getDifficulties() {
    difficultiesPromise ??= api
      .get(API_ENDPOINTS.CATALOGS.DIFFICULTIES)
      .then(unwrapList)
      .catch((error) => {
        difficultiesPromise = null
        throw error
      })
    return difficultiesPromise
  },

  /** Modos de viaje: [{ id, name, key }]. */
  getTravelModes() {
    travelModesPromise ??= api
      .get(API_ENDPOINTS.CATALOGS.TRAVEL_MODES)
      .then(unwrapList)
      .catch((error) => {
        travelModesPromise = null
        throw error
      })
    return travelModesPromise
  },

  /**
   * Crea una ruta hacia un spot.
   * @param {number|string} spotId
   * @param {{ path: object, difficulty: string, travel_mode: string, description?: string }} payload
   *   `path` es un GeoJSON LineString; `difficulty` y `travel_mode` son las `key` del catálogo.
   */
  async createRoute(spotId, payload) {
    const response = await api.post(API_ENDPOINTS.SPOTS.ROUTES(spotId), payload)
    return unwrap(response)
  },

  /**
   * Sube una foto tomada durante el recorrido.
   * @param {{ file: File, location: object }} photo `location` es un GeoJSON Point.
   */
  async uploadRoutePhoto(spotId, routeId, { file, location }) {
    const form = new FormData()
    form.append('img_path', file)
    form.append('location', JSON.stringify(location))
    const response = await api.postForm(API_ENDPOINTS.ROUTES.PHOTOS(spotId, routeId), form)
    return unwrap(response)
  },

  /** Rutas creadas por el usuario autenticado (historial). */
  async getMyRoutes() {
    const response = await api.get(API_ENDPOINTS.ROUTES.MINE)
    return unwrapList(response)
  },

  async addFavorite(spotId, routeId) {
    await api.post(API_ENDPOINTS.ROUTES.ADD_FAVORITE(spotId, routeId))
  },

  async removeFavorite(spotId, routeId) {
    await api.post(API_ENDPOINTS.ROUTES.REMOVE_FAVORITE(spotId, routeId))
  },
}
