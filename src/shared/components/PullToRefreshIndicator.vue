<script setup>
import { computed } from 'vue'
import Icon from './Icon.vue'

const props = defineProps({
  distance: {
    type: Number,
    default: 0,
  },
  progress: {
    type: Number,
    default: 0,
  },
  armed: {
    type: Boolean,
    default: false,
  },
  refreshing: {
    type: Boolean,
    default: false,
  },
})

// Acompaña al dedo: baja con el tirón y se desvanece al soltar.
const style = computed(() => ({
  transform: `translate3d(-50%, ${props.distance}px, 0)`,
  opacity: props.refreshing ? 1 : props.progress,
  transition: props.distance === 0 || props.refreshing
    ? 'transform 0.25s var(--ease-out), opacity 0.2s ease'
    : 'none',
}))

// La flecha apunta hacia abajo y gira hasta apuntar arriba al armarse.
const iconStyle = computed(() => ({
  transform: `rotate(${props.armed ? 180 : props.progress * 180}deg)`,
}))
</script>

<template>
  <div v-show="distance > 0 || refreshing" class="ptr" :style="style" aria-hidden="true">
    <div class="ptr-disc" :class="{ 'is-armed': armed, 'is-refreshing': refreshing }">
      <span v-if="refreshing" class="ptr-spinner"></span>
      <Icon v-else name="ChevronDown" :size="20" :style="iconStyle" class="ptr-arrow" />
    </div>
  </div>
</template>

<style scoped>
.ptr {
  position: fixed;
  top: calc(var(--safe-area-inset-top) + var(--space-2));
  left: 50%;
  z-index: var(--z-sticky);
  pointer-events: none;
  will-change: transform, opacity;
}

.ptr-disc {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-md);
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color var(--transition-fast), transform var(--transition-fast);
}

.ptr-disc.is-armed {
  color: var(--color-primary);
  transform: scale(1.08);
}

.ptr-arrow {
  transform-origin: center;
  transition: transform var(--transition-fast);
}

.ptr-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-primary);
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
