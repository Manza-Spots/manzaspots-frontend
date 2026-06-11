import { ref } from 'vue'

const isImmersive = ref(false)

export function useImmersiveMode() {
  return { isImmersive }
}
