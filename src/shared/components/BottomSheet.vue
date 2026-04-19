<script setup>
import { onMounted, onUnmounted, watch, ref, computed } from 'vue'
import { useBottomSheet } from '@/shared/composables/useBottomSheet'
import Icon from './Icon.vue'

defineOptions({
  name: 'BottomSheet',
})

const { isOpen, component, props: childProps, config, close } = useBottomSheet()

const handleBackdropClick = () => {
  if (config.value.closeOnBackdrop) {
    close()
  }
}

const handleEscape = (e) => {
  if (e.key === 'Escape' && config.value.closable && isOpen.value) {
    close()
  }
}

const sheetBodyRef = ref(null)
const startY = ref(0)
const currentY = ref(0)
const isDragging = ref(false)

const dragStyle = computed(() => {
  if (!isDragging.value) return {}
  const y = currentY.value > 0 ? currentY.value : currentY.value * 0.15
  return { '--drag-y': `${y}px` }
})

const onTouchStart = (e) => {
  const target = e.target
  const bodyEl = sheetBodyRef.value

  if (bodyEl && bodyEl.contains(target) && bodyEl.scrollTop > 0) {
    return
  }

  startY.value = e.touches[0].clientY
  isDragging.value = true
  currentY.value = 0
}

const onTouchMove = (e) => {
  if (!isDragging.value) return

  const deltaY = e.touches[0].clientY - startY.value

  if (deltaY < 0 && sheetBodyRef.value && sheetBodyRef.value.contains(e.target)) {
    isDragging.value = false
    currentY.value = 0
    return
  }

  currentY.value = deltaY
}

const onTouchEnd = () => {
  if (!isDragging.value) return
  isDragging.value = false

  if (currentY.value > 100) {
    close()
  } else {
    currentY.value = 0
  }
}

watch(isOpen, (newValue) => {
  if (newValue) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="bottom-sheet">
      <div
        v-if="isOpen"
        class="bottom-sheet-backdrop"
        @click="handleBackdropClick"
        role="dialog"
        aria-modal="true"
        :aria-label="config.title || 'Menú emergente'"
      >
        <div
          class="bottom-sheet-content"
          :class="{ 'is-dragging': isDragging }"
          :style="dragStyle"
          @touchstart="onTouchStart"
          @touchmove="onTouchMove"
          @touchend="onTouchEnd"
          @click.stop
        >

          <div class="bottom-sheet-drag-handle" @click="close" aria-label="Cerrar al tocar barra">
            <div class="drag-bar"></div>
          </div>

          <div v-if="config.title || config.closable" class="bottom-sheet-header">
            <h3 v-if="config.title" class="bottom-sheet-title">{{ config.title }}</h3>
            <div v-else></div>

            <button v-if="config.closable" class="bottom-sheet-close" @click="close" aria-label="Cerrar">
              <Icon name="X" :size="20" />
            </button>
          </div>

          <div ref="sheetBodyRef" class="bottom-sheet-body">
            <component
              v-if="component"
              :is="component"
              v-bind="childProps"
              @close="close"
            />
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.bottom-sheet-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: var(--z-modal-backdrop, 1000);
  padding: 0;
}

.bottom-sheet-content {
  background-color: var(--color-bg);
  border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
  box-shadow: var(--shadow-xl);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: var(--z-modal, 1010);
  padding-bottom: var(--safe-area-inset-bottom, env(safe-area-inset-bottom, var(--space-4)));
  
  /* Lógica de transform y transición base permanente */
  transform: translateY(var(--drag-y, 0px));
  transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  will-change: transform;
}

.bottom-sheet-content.is-dragging {
  transition: transform 0s !important;
}

.bottom-sheet-drag-handle {
  width: 100%;
  display: flex;
  justify-content: center;
  padding: var(--space-4) 0 var(--space-2);
  cursor: pointer;
}

.drag-bar {
  width: 48px;
  height: 5px;
  background-color: var(--color-gray-300);
  border-radius: var(--radius-full);
}

.bottom-sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-6) var(--space-4);
}

.bottom-sheet-title {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  margin: 0;
}

.bottom-sheet-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  color: var(--color-text-secondary);
  background-color: var(--color-gray-100);
  transition: all var(--transition-fast);
}

.bottom-sheet-close:active,
.bottom-sheet-close:hover {
  background-color: var(--color-gray-200);
  color: var(--color-text-primary);
}

.bottom-sheet-body {
  padding: 0 var(--space-6) var(--space-6);
  overflow-y: auto;
  flex: 1;
}

/* Transiciones animadas */
.bottom-sheet-enter-active,
.bottom-sheet-leave-active {
  transition: opacity 0.3s ease;
}

.bottom-sheet-enter-from,
.bottom-sheet-leave-to {
  opacity: 0;
}

/* La transición principal ahora es dominada por la clase base .bottom-sheet-content */

.bottom-sheet-leave-active .bottom-sheet-content {
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.bottom-sheet-enter-from .bottom-sheet-content,
.bottom-sheet-leave-to .bottom-sheet-content {
  --drag-y: 100%;
}
</style>
