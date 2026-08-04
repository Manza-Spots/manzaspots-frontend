import { ref, onMounted } from 'vue'
import { useRegisterSW } from 'virtual:pwa-register/vue'

export function usePWA() {
  const isInstallable = ref(false)
  const isInstalled = ref(false)
  const isOnline = ref(navigator.onLine)
  const deferredPrompt = ref(null)

  const { offlineReady, needRefresh, updateServiceWorker } = useRegisterSW({
    onRegisterError(error) {
      console.error('Error al registrar el Service Worker: ', error)
    },
  })

  const handleBeforeInstallPrompt = (e) => {
    e.preventDefault()
    deferredPrompt.value = e
    isInstallable.value = true
  }

  const installPWA = async () => {
    if (!deferredPrompt.value) return false

    deferredPrompt.value.prompt()
    const { outcome } = await deferredPrompt.value.userChoice

    if (outcome === 'accepted') {
      isInstallable.value = false
      isInstalled.value = true
      deferredPrompt.value = null
      return true
    }

    return false
  }

  const checkIfInstalled = () => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      isInstalled.value = true
      isInstallable.value = false
    }
  }

  const updateOnlineStatus = () => {
    isOnline.value = navigator.onLine
  }

  onMounted(() => {
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    checkIfInstalled()
  })

  return {
    isInstallable,
    isInstalled,
    isOnline,
    offlineReady,
    needRefresh,
    installPWA,
    updateServiceWorker,
  }
}
