import { HTTP_STATUS, AUTH_ERRORS } from '@/core/config/api.config'
import { useToast } from '@/shared/composables/useToast'

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
    // Error de red (sin respuesta del servidor)
    if (!error.response) {
      return this.handleNetworkError(error)
    }

    // Error con respuesta del servidor
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

  handleNetworkError(error) {
    const apiError = new ApiError(AUTH_ERRORS.NETWORK_ERROR, 0, { originalError: error })

    this.toast.error('No se pudo conectar con el servidor. Verifica tu conexión.')

    return apiError
  }

  handleBadRequest(data) {
    const message = this.extractErrorMessage(data) || 'Solicitud inválida'
    const apiError = new ApiError(message, HTTP_STATUS.BAD_REQUEST, data)

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

    // Extraer errores de campo específicos
    if (data && typeof data === 'object') {
      apiError.fieldErrors = this.extractFieldErrors(data)
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

  // Helpers
  extractErrorMessage(data) {
    if (!data) return null

    if (data.detail) return data.detail
    if (data.message) return data.message
    if (data.error) return data.error

    if (typeof data === 'object' && !Array.isArray(data)) {
      const firstKey = Object.keys(data)[0]
      if (firstKey && Array.isArray(data[firstKey])) {
        return data[firstKey][0]
      }
    }

    if (Array.isArray(data) && data.length > 0) {
      return data[0]
    }

    return null
  }

  extractFieldErrors(data) {
    const fieldErrors = {}

    if (typeof data === 'object' && !Array.isArray(data)) {
      Object.keys(data).forEach((field) => {
        if (Array.isArray(data[field])) {
          fieldErrors[field] = data[field][0]
        } else if (typeof data[field] === 'string') {
          fieldErrors[field] = data[field]
        }
      })
    }

    return fieldErrors
  }
}

export const errorHandler = new ErrorHandler()
