import { ref } from 'vue'
import { Capacitor } from '@capacitor/core'
import { Keyboard } from '@capacitor/keyboard'

// Altura del teclado, compartida entre componentes (BottomNav, panel de
// resultados, etc.) para que puedan reposicionarse cuando aparece el teclado.
const keyboardHeight = ref(0)
let initialized = false

function setup() {
  if (initialized) return
  initialized = true

  if (Capacitor.isNativePlatform()) {
    Keyboard.addListener('keyboardWillShow', (info) => {
      keyboardHeight.value = info.keyboardHeight
    })
    Keyboard.addListener('keyboardWillHide', () => {
      keyboardHeight.value = 0
    })
    return
  }

  // Fallback web: visualViewport se encoge al aparecer el teclado virtual.
  if (typeof window !== 'undefined' && window.visualViewport) {
    const vv = window.visualViewport
    const onResize = () => {
      const overlap = window.innerHeight - vv.height - vv.offsetTop
      keyboardHeight.value = overlap > 0 ? overlap : 0
    }
    vv.addEventListener('resize', onResize)
    vv.addEventListener('scroll', onResize)
  }
}

export function useKeyboard() {
  setup()
  return { keyboardHeight }
}
