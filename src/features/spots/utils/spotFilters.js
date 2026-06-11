export const CATEGORY_FILTERS = [
  { key: 'all', icon: 'MapPin', match: null },
  { key: 'miradores', icon: 'Mountain', match: ['Mirador'] },
  { key: 'trekking', icon: 'Footprints', match: ['Trekking'] },
  { key: 'cascadas', icon: 'Droplets', match: ['Cascadas'] },
  { key: 'playas', icon: 'Waves', match: ['Playa Inclusiva', 'Playa'] },
]

export const DISTANCE_FILTERS = [
  { key: 'near', max: 5 },
  { key: 'mid', max: 15 },
  { key: 'all', max: Infinity },
]

export const DEFAULT_FILTERS = { category: 'all', distance: 'all' }

const CATEGORY_ICONS = {
  Mirador: 'Mountain',
  Trekking: 'Footprints',
  Cascadas: 'Droplets',
  'Playa Inclusiva': 'Waves',
  Playa: 'Waves',
}

export const categoryIcon = (category) => CATEGORY_ICONS[category] ?? 'MapPin'

export const parseKm = (distance) => {
  const value = parseFloat(distance)
  return Number.isNaN(value) ? 0 : value
}

export const isFilterActive = (filters) =>
  filters.category !== 'all' || filters.distance !== 'all'

export const filterSpots = (spots, filters) => {
  const category = CATEGORY_FILTERS.find((c) => c.key === filters.category)
  const distance = DISTANCE_FILTERS.find((d) => d.key === filters.distance)

  return spots.filter((spot) => {
    const categoryOk = !category?.match || category.match.includes(spot.category)
    const distanceOk = !distance || parseKm(spot.distance) <= distance.max
    return categoryOk && distanceOk
  })
}
