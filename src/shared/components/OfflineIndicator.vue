<script setup>
import { usePWA } from '@/shared/composables/usePWA'

const { isOnline } = usePWA()
</script>

<template>
  <Transition name="slide">
    <div v-if="!isOnline" class="offline-indicator">
      <span>🔌</span>
      Sin conexión - Trabajando offline
    </div>
  </Transition>
</template>

<style scoped>
.offline-indicator {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: #ff9800;
  color: white;
  padding: 12px;
  text-align: center;
  font-size: 14px;
  font-weight: 500;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateY(-100%);
}
</style>
