import { ref } from 'vue'
import { SplashScreen } from '@capacitor/splash-screen'
import { isNative } from '@/core/capacitor'

const isAppReady = ref(false)
let initialized = false

export function useAppReady() {
  async function markReady() {
    if (initialized) return
    initialized = true

    if (isNative) {
      try {
        await SplashScreen.hide({ fadeOutDuration: 300 })
      } catch (error) {
        console.warn('SplashScreen.hide error:', error)
      }
    }

    setTimeout(() => {
      isAppReady.value = true
    }, 300)
  }

  return {
    isAppReady,
    markReady,
  }
}
