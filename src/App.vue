<script setup>
import { RouterView } from 'vue-router'
import PWAUpdatePrompt from '@/shared/components/PWAUpdatePrompt.vue'
import OfflineIndicator from '@/shared/components/OfflineIndicator.vue'
import ToastContainer from '@/shared/components/ToastContainer.vue'
</script>

<template>
  <div id="app">
    <OfflineIndicator />

    <RouterView />

    <PWAUpdatePrompt />
    <ToastContainer />
  </div>
</template>

<style>
#app {
  min-height: 100vh;
}
</style>
