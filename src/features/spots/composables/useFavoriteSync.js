import { ref } from 'vue'

const lastChange = ref(null)

export function useFavoriteSync() {
  const markFavorite = (spotId, isFavorite) => {
    lastChange.value = { spotId, isFavorite, at: Date.now() }
  }

  const applyChange = (list, change) => {
    if (!change || !Array.isArray(list)) return list
    let hit = false
    const next = list.map((spot) => {
      if (spot.id !== change.spotId) return spot
      hit = true
      return { ...spot, isFavorite: change.isFavorite }
    })
    return hit ? next : list
  }

  return { lastChange, markFavorite, applyChange }
}
