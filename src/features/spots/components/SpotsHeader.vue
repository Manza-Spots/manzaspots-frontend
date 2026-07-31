<script setup>
import Icon from '@/shared/components/Icon.vue'
import { useImmersiveMode } from '@/shared/composables/useImmersiveMode'

defineProps({
  currentView: {
    type: String,
    required: true
  },
  isLocating: {
    type: Boolean,
    default: false
  },
  hasActiveFilters: {
    type: Boolean,
    default: false
  }
})

const { isImmersive } = useImmersiveMode()

const emit = defineEmits(['update:currentView', 'locate', 'filter'])
</script>

<template>
  <div class="spots-header-overlay" :class="{ 'is-list-mode': currentView === 'list' }">

    <div class="header-col left-col">
      <button
        v-if="!isImmersive"
        class="header-fab-btn"
        :class="{ 'is-loading': isLocating }"
        @click="emit('locate')"
      >
        <Icon name="LocateFixed" :size="24" class="icon-svg" />
      </button>
    </div>

    <div class="header-col center-col">
      <div class="toggle-pill">
        <div class="toggle-slider" :class="currentView"></div>
        <button
          :class="['toggle-btn', { active: currentView === 'map' }]"
          @click="emit('update:currentView', 'map')"
        >
          <Icon name="Map" :size="18" />
        </button>
        <button
          :class="['toggle-btn', { active: currentView === 'list' }]"
          @click="emit('update:currentView', 'list')"
        >
          <Icon name="List" :size="18" />
        </button>
      </div>
    </div>

    <div class="header-col right-col">
      <button
        v-if="!isImmersive"
        class="header-fab-btn"
        @click="emit('filter')"
      >
        <Icon name="SlidersHorizontal" :size="24" class="icon-svg" />
        <span v-if="hasActiveFilters" class="filter-dot"></span>
      </button>
    </div>

  </div>
</template>

<style scoped>
.spots-header-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: calc(var(--safe-area-inset-top, 20px) + var(--space-4)) var(--space-4) var(--space-4);
  z-index: 20;
  pointer-events: none;
}

.header-col {
  pointer-events: auto;
  display: flex;
  align-items: center;
}

.left-col {
  flex: 1;
  justify-content: flex-start;
}

.center-col {
  flex: 0 0 auto;
  justify-content: center;
}

.right-col {
  flex: 1;
  justify-content: flex-end;
}

.header-fab-btn {
  position: relative;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: var(--color-bg, #ffffff);
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.04);
  color: var(--color-text-primary);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.header-fab-btn:active {
  transform: scale(0.9);
}

.is-loading .icon-svg {
  animation: pulse 1s infinite cubic-bezier(0.4, 0, 0.2, 1);
  color: var(--color-primary);
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); opacity: 0.5; }
}

.toggle-pill {
  position: relative;
  display: flex;
  background: var(--glass-bg);
  -webkit-backdrop-filter: var(--blur);
  backdrop-filter: var(--blur);
  border-radius: var(--radius-full);
  padding: 4px;
  border: 1px solid var(--hairline);
  box-shadow: var(--shadow-md);
}

.toggle-slider {
  position: absolute;
  top: 4px;
  bottom: 4px;
  left: 4px;
  width: calc(50% - 4px);
  background: var(--color-primary-tint);
  border-radius: var(--radius-full);
  transition: transform 0.5s var(--ease-spring);
  z-index: 0;
}

.toggle-slider.map {
  transform: translateX(0);
}

.toggle-slider.list {
  transform: translateX(100%);
}

.toggle-btn {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  background: transparent !important;
  border-radius: var(--radius-full);
  color: var(--color-text-secondary);
  font-weight: var(--font-bold);
  font-size: 15px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.toggle-btn.active {
  color: var(--color-primary);
}

/* Animación elástica del BottomNav */
.toggle-btn.active :deep(svg) {
  color: var(--color-primary);
  animation: pop-bounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes pop-bounce {
  0% { transform: scale(1); }
  45% { transform: scale(1.3); }
  70% { transform: scale(0.9); }
  100% { transform: scale(1); }
}

.filter-dot {
  position: absolute;
  top: 7px;
  right: 7px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--color-selva-bright);
  border: 2px solid rgba(10, 20, 14, 0.35);
}

/* Vidrio sobre foto: la vista inmersiva (lista) renderiza el header sobre la imagen */
.is-list-mode .header-fab-btn {
  background: rgba(255, 255, 255, 0.16);
  -webkit-backdrop-filter: saturate(160%) blur(14px);
  backdrop-filter: saturate(160%) blur(14px);
  border-color: rgba(255, 255, 255, 0.28);
  box-shadow: none;
  color: #fff;
}

.is-list-mode .toggle-pill {
  background: rgba(255, 255, 255, 0.16);
  -webkit-backdrop-filter: saturate(160%) blur(14px);
  backdrop-filter: saturate(160%) blur(14px);
  border-color: rgba(255, 255, 255, 0.28);
  box-shadow: none;
}

.is-list-mode .toggle-slider {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.22);
}

.is-list-mode .toggle-btn {
  color: rgba(255, 255, 255, 0.92);
}

.is-list-mode .toggle-btn.active,
.is-list-mode .toggle-btn.active :deep(svg) {
  color: var(--color-selva-deep);
}
</style>
