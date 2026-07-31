import { ref } from 'vue'

// Estado de búsqueda compartido entre el BottomNav (donde vive el input) y la
// vista de Spots (que consume el término para filtrar mapa + lista).
const query = ref('')

export function useSpotsSearch() {
  return { query }
}
