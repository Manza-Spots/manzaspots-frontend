// El mapa muestra spots por proximidad: un radio (km) alrededor del usuario,
// ajustable con un slider. La lista, en cambio, es un catálogo global.
export const RADIUS_MIN_KM = 1
export const RADIUS_MAX_KM = 50
export const DEFAULT_RADIUS_KM = 15

export const DEFAULT_FILTERS = { radiusKm: DEFAULT_RADIUS_KM }

export const isFilterActive = (filters) => filters.radiusKm !== DEFAULT_RADIUS_KM

export const parseKm = (distance) => {
  const value = parseFloat(distance)
  return Number.isNaN(value) ? 0 : value
}
