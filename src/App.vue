<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { RouterView } from 'vue-router'
import PWAUpdatePrompt from '@/shared/components/PWAUpdatePrompt.vue'
import OfflineIndicator from '@/shared/components/OfflineIndicator.vue'
import ToastContainer from '@/shared/components/ToastContainer.vue'
import BottomNav from './shared/components/BottomNav.vue'

const route = useRoute()

const hideBottomNav = computed(() => {
  const authRoutes = ['/login', '/register']
  const otherRoutes = ['/ui', '/terms', '/privacy']
  return authRoutes.includes(route.path) || otherRoutes.includes(route.path)
})
</script>

<template>
  <div id="app">
    <OfflineIndicator />
    <PWAUpdatePrompt />
    <ToastContainer />

    <RouterView />

    <BottomNav v-if="!hideBottomNav" />
  </div>
</template>

<style>
#app {
  min-height: 100vh;
}
</style>
