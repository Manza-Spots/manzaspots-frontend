<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { RouterView } from 'vue-router'
import PWAUpdatePrompt from '@/shared/components/PWAUpdatePrompt.vue'
import OfflineIndicator from '@/shared/components/OfflineIndicator.vue'
import ToastContainer from '@/shared/components/ToastContainer.vue'
import BottomSheet from '@/shared/components/BottomSheet.vue'
import BottomNav from './shared/components/BottomNav.vue'
import { useAppReady } from '@/shared/composables/useAppReady'
import { useTheme } from '@/shared/composables/useTheme'

const route = useRoute()
const { markReady } = useAppReady()
const { initializeTheme } = useTheme()

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

onMounted(() => {
  markReady()
  initializeTheme()
})
</script>

<template>
  <div id="app">
    <OfflineIndicator />
    <PWAUpdatePrompt />
    <ToastContainer />
    <BottomSheet />

    <RouterView />

    <BottomNav v-if="!hideBottomNav" />
  </div>
</template>

<style>
#app {
  min-height: 100vh;
}
</style>
