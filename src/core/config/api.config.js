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
    UPDATE_PROFILE: '/users/me/update/',
  },

  SPOTS: {
    LIST: '/spots/',
    DETAIL: (id) => `/spots/${id}/`,
    CREATE: '/spots/',
    FAVORITES: '/spots/favorites/',
  },

  ROUTES: {
    LIST: '/routes/',
    DETAIL: (id) => `/routes/${id}/`,
    CREATE: '/routes/',
    TRACK: '/routes/track/',
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
