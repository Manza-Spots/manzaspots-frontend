<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { RouterView } from 'vue-router'
import PWAUpdatePrompt from '@/shared/components/PWAUpdatePrompt.vue'
import OfflineIndicator from '@/shared/components/OfflineIndicator.vue'
import ToastContainer from '@/shared/components/ToastContainer.vue'
import BottomSheet from '@/shared/components/BottomSheet.vue'
import BottomNav from './shared/components/BottomNav.vue'
import SplashScreen from '@/shared/components/SplashScreen.vue'
import { useAppReady } from '@/shared/composables/useAppReady'
import { useTheme } from '@/shared/composables/useTheme'
import { useI18n } from 'vue-i18n'
import { Preferences } from '@capacitor/preferences'
import { Keyboard } from '@capacitor/keyboard'

const route = useRoute()
const { markReady } = useAppReady()
const { initializeTheme } = useTheme()
const { locale } = useI18n()

const showSplash = ref(true)

const hideBottomNav = computed(() => {
  const hiddenRoutes = [
    '/ui',
    '/terms',
    '/privacy',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/email-verified'
  ]
  return hiddenRoutes.includes(route.path)
})

onMounted(async () => {
  try {
    const { value } = await Preferences.get({ key: 'manzaspots_language_preference' })
    if (value) {
      locale.value = value
    }
  } catch(e) {
    console.error(e)
  }

  await initializeTheme()
  markReady()

  document.addEventListener('touchend', (e) => {
    const activeElement = document.activeElement
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
      if (
        e.target !== activeElement &&
        e.target.tagName !== 'INPUT' &&
        e.target.tagName !== 'TEXTAREA'
      ) {
        activeElement.blur()
        Keyboard.hide().catch(() => {})
      }
    }
  })
})
</script>

<template>
  <div id="app">
    <SplashScreen v-if="showSplash" @done="showSplash = false" />
    <OfflineIndicator />
    <PWAUpdatePrompt />
    <ToastContainer />
    <BottomSheet />

    <RouterView v-slot="{ Component }">
      <!-- El mapa se conserva vivo entre pestañas: recrearlo obliga a
           reinicializar MapLibre y a volver a pedir tiles y spots. -->
      <KeepAlive :include="['SpotsView']">
        <component :is="Component" />
      </KeepAlive>
    </RouterView>

    <BottomNav v-if="!hideBottomNav" />
  </div>
</template>

<style>
#app {
  min-height: 100vh;
}
</style>
