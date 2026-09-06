import { ref } from 'vue'

const isNavHidden = ref(false)

export function useNavVisibility() {
  return { isNavHidden }
}
