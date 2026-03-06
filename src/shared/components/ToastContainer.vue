<script setup>
import { useToast } from '@/shared/composables/useToast'
import Toast from './Toast.vue'

const { toasts, remove } = useToast()
</script>

<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast-list">
        <Toast
          v-for="toast in toasts"
          :key="toast.id"
          :message="toast.message"
          :variant="toast.variant"
          :closable="toast.closable"
          @close="remove(toast.id)"
        />
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: var(--space-4);
  right: var(--space-4);
  left: var(--space-4);
  z-index: var(--z-tooltip);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  pointer-events: none;
  max-width: 600px;
  margin: 0 auto;
}

.toast-container > * {
  pointer-events: auto;
}

.toast-list-enter-active {
  transition: all 0.3s ease;
}

.toast-list-leave-active {
  transition: all 0.3s ease;
}

.toast-list-enter-from {
  opacity: 0;
  transform: translateY(-100%);
}

.toast-list-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

.toast-list-move {
  transition: transform 0.3s ease;
}

/* Mobile adjustments */
@media (max-width: 640px) {
  .toast-container {
    left: var(--space-3);
    right: var(--space-3);
    max-width: none;
  }
}

/* Si hay PWA install prompt arriba, ajustar posición */
@media (max-width: 640px) {
  .toast-container {
    top: calc(var(--space-4) + var(--safe-area-inset-top));
  }
}
</style>
