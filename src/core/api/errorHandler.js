import { HTTP_STATUS, AUTH_ERRORS } from '@/core/config/api.config'
import { useToast } from '@/shared/composables/useToast'
import { isOffline } from '@/core/network/connectivity'
import i18n from '@/core/i18n'

class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export class ErrorHandler {
  constructor() {
    this.toast = useToast()
  }

  handle(error) {
    if (!error.response) {
      return this.handleNetworkError(error)
    }

    const { status, data } = error.response

    switch (status) {
      case HTTP_STATUS.BAD_REQUEST:
        return this.handleBadRequest(data)

      case HTTP_STATUS.UNAUTHORIZED:
        return this.handleUnauthorized(data)

      case HTTP_STATUS.FORBIDDEN:
        return this.handleForbidden(data)

      case HTTP_STATUS.NOT_FOUND:
        return this.handleNotFound(data)

      case HTTP_STATUS.CONFLICT:
        return this.handleConflict(data)

      case HTTP_STATUS.UNPROCESSABLE_ENTITY:
        return this.handleValidationError(data)

      case HTTP_STATUS.INTERNAL_SERVER_ERROR:
        return this.handleServerError(data)

      case HTTP_STATUS.SERVICE_UNAVAILABLE:
        return this.handleServiceUnavailable(data)

      default:
        return this.handleUnknownError(error)
    }
  }

  // La petición no llegó al servidor. Sin conexión no se avisa: ya lo dice el
  // aviso fijo de la barra de navegación y cada vista muestra su estado; un
  // aviso por petición fallida llenaba la pantalla de copias. Con conexión el
  // servidor no responde, y eso sí se avisa (useToast junta los repetidos).
  handleNetworkError(error) {
    const offline = isOffline() || error?.code === 'ERR_OFFLINE'
    const message = i18n.global.t(offline ? 'common.network.offlineAction' : 'common.network.unreachable')
    const apiError = new ApiError(message, 0, { originalError: error })
    apiError.network = true
    apiError.offline = offline

    if (!offline) this.toast.error(message)

    return apiError
  }

  handleBadRequest(data) {
    const message = this.extractErrorMessage(data) || 'Solicitud inválida'
    const apiError = new ApiError(message, HTTP_STATUS.BAD_REQUEST, data)

    if (data?.errors?.context && typeof data.errors.context === 'object') {
      apiError.fieldErrors = this.extractFieldErrors(data.errors.context)
    }

    return apiError
  }

  handleUnauthorized(data) {
    const message = this.extractErrorMessage(data) || AUTH_ERRORS.UNAUTHORIZED
    const apiError = new ApiError(message, HTTP_STATUS.UNAUTHORIZED, data)

    return apiError
  }

  handleForbidden(data) {
    const message = this.extractErrorMessage(data) || 'Acceso denegado'
    const apiError = new ApiError(message, HTTP_STATUS.FORBIDDEN, data)

    this.toast.error('No tienes permisos para realizar esta acción')

    return apiError
  }

  handleNotFound(data) {
    const message = this.extractErrorMessage(data) || 'Recurso no encontrado'
    const apiError = new ApiError(message, HTTP_STATUS.NOT_FOUND, data)

    return apiError
  }

  handleConflict(data) {
    const message = this.extractErrorMessage(data) || 'Conflicto en la solicitud'
    const apiError = new ApiError(message, HTTP_STATUS.CONFLICT, data)

    return apiError
  }

  handleValidationError(data) {
    const message = this.extractErrorMessage(data) || 'Error de validación'
    const apiError = new ApiError(message, HTTP_STATUS.UNPROCESSABLE_ENTITY, data)

    const context = data?.errors?.context || data
    if (context && typeof context === 'object') {
      apiError.fieldErrors = this.extractFieldErrors(context)
    }

    return apiError
  }

  handleServerError(data) {
    const message = 'Error interno del servidor'
    const apiError = new ApiError(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, data)

    this.toast.error('Ocurrió un error. Por favor intenta más tarde.')

    return apiError
  }

  handleServiceUnavailable(data) {
    const message = 'Servicio no disponible'
    const apiError = new ApiError(message, HTTP_STATUS.SERVICE_UNAVAILABLE, data)

    this.toast.error('El servicio no está disponible. Intenta más tarde.')

    return apiError
  }

  handleUnknownError(error) {
    const message = 'Error desconocido'
    const apiError = new ApiError(message, 0, error)

    this.toast.error('Ocurrió un error inesperado')

    return apiError
  }

  extractErrorMessage(data) {
    if (!data) return null

    if (data.errors?.context && typeof data.errors.context === 'string') {
      return data.errors.context
    }

    if (data.detail) return data.detail
    if (data.message) return data.message
    if (data.error) return data.error

    if (data.errors?.context && typeof data.errors.context === 'object') {
      return this.extractFromValidationObject(data.errors.context)
    }

    if (typeof data === 'object' && !Array.isArray(data)) {
      return this.extractFromValidationObject(data)
    }

    if (Array.isArray(data) && data.length > 0) {
      return data[0]
    }

    return null
  }

  extractFromValidationObject(obj) {
    const firstKey = Object.keys(obj)[0]
    if (!firstKey) return null
    
    const value = obj[firstKey]
    if (Array.isArray(value) && value.length > 0) {
      return value[0]
    }
    if (typeof value === 'string') {
      return value
    }
    return null
  }

  extractFieldErrors(data) {
    const fieldErrors = {}

    if (typeof data === 'object' && !Array.isArray(data)) {
      Object.keys(data).forEach((field) => {
        const value = data[field]

        if (Array.isArray(value)) {
          fieldErrors[field] = value[0]
        } else if (typeof value === 'string') {
          fieldErrors[field] = value
        }
      })
    }

    return fieldErrors
  }
}

export const errorHandler = new ErrorHandler()
