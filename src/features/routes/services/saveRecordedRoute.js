import { routesApi } from '@/features/routes/api/routesApi'
import { toLineString, toPoint } from '@/features/tracking/utils/geo'

/**
 * Guarda una ruta grabada en un spot y sube sus fotos una a una: una foto que
 * falle no tumba la ruta ya creada.
 *
 * @returns {Promise<{ route: object, failedPhotos: number }>}
 */
export async function saveRecordedRoute(spotId, { track, photos = [], difficulty, travelMode, description = '' }) {
  const path = toLineString(track.points)
  if (!path) throw new Error('La ruta es muy corta para guardarla')

  const route = await routesApi.createRoute(spotId, {
    path,
    difficulty,
    travel_mode: travelMode,
    description: description.trim(),
  })

  let failedPhotos = 0
  for (const photo of photos) {
    try {
      await routesApi.uploadRoutePhoto(spotId, route.id, {
        file: photo.file,
        location: toPoint(photo.location),
      })
    } catch (error) {
      console.warn('No se pudo subir una foto de la ruta', error)
      failedPhotos += 1
    }
  }
  return { route, failedPhotos }
}

// Lo que se eligió en la hoja de guardar (dificultad, modo, descripción) antes
// de ir a proponer un spot nuevo: el formulario del spot guarda la ruta con ello.
let routeDraft = null

export function setRouteDraft(draft) {
  routeDraft = draft
}

/** Devuelve el borrador sin borrarlo; `clearRouteDraft` al guardarse la ruta. */
export function getRouteDraft() {
  return routeDraft
}

export function clearRouteDraft() {
  routeDraft = null
}
