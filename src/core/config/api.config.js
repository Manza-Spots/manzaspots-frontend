export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
}

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login/',
    LOGIN_GOOGLE: '/auth/oauth/google/',
    REGISTER: '/auth/register/',
    LOGOUT: '/auth/logout/',
    REFRESH: '/auth/token/refresh/',
    USER: '/users/me/',
    VERIFY_EMAIL: '/auth/email/verify',
    RESEND_EMAIL: '/auth/resend-token/',
    RESET_PASSWORD: '/auth/password/reset/',
    RESET_PASSWORD_CONFIRM: '/auth/password/reset/confirm/',
    CHANGE_PASSWORD: '/auth/password/change/',
  },

  USERS: {
    ME: '/users/me/',
    PROFILE: (id) => `/users/${id}/`,
    PROFILE_THUMB: '/users/profile/thumb/',
    EMAIL_CHANGE: '/users/me/email/request-change',
  },

  SPOTS: {
    LIST: '/spots/',
    DETAIL: (id) => `/spots/${id}/`,
    CREATE: '/spots/',
    MINE: '/spots/my_spots/',
    FAVORITES: '/spots/favorites/',
    FAVORITE: (id) => `/spots/${id}/favorites/`,
    AUTHORIZE: (id) => `/spots/${id}/authorize/`,
    DENY: (id) => `/spots/${id}/deny/`,
    CAPTIONS: (id) => `/spots/${id}/captions/`,
    ROUTES: (id) => `/spots/${id}/routes/`,
  },

  ROUTES: {
    MINE: '/routes/mine/',
    FAVORITES: '/routes/favorites/',
    ADD_FAVORITE: (spotId, id) => `/spots/${spotId}/routes/${id}/add_favorite/`,
    REMOVE_FAVORITE: (spotId, id) => `/spots/${spotId}/routes/${id}/remove_favorite/`,
    PHOTOS: (spotId, id) => `/spots/${spotId}/routes/${id}/photos/`,
  },

  CATALOGS: {
    DIFFICULTIES: '/difficulties/',
    TRAVEL_MODES: '/travel-modes/',
  },
}

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
}

export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Credenciales inválidas',
  EMAIL_NOT_VERIFIED: 'Email no verificado',
  TOKEN_EXPIRED: 'Sesión expirada',
  UNAUTHORIZED: 'No autorizado',
  ACCOUNT_DISABLED: 'Cuenta deshabilitada',
  NETWORK_ERROR: 'Error de conexión',
}
