<script setup>
import Icon from '@/shared/components/Icon.vue'

defineProps({
  currentView: {
    type: String,
    required: true
  },
  isLocating: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:currentView', 'locate', 'filter'])
</script>

<template>
  <div class="spots-header-overlay" :class="{ 'is-list-mode': currentView === 'list' }">

    <div class="header-col left-col">
      <button
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
        class="header-fab-btn"
        @click="emit('filter')"
      >
        <Icon name="SlidersHorizontal" :size="24" class="icon-svg" />
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
  width: 45px;
  height: 45px;
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
  background: rgb(255, 255, 255);
  -webkit-backdrop-filter: saturate(180%) blur(2px);
  backdrop-filter: saturate(180%) blur(2px);
  border-radius: 100px;
  padding: 4px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.04);
}

:global(html.dark) .toggle-pill {
  background: rgba(28, 28, 30, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.toggle-slider {
  position: absolute;
  top: 4px;
  bottom: 4px;
  left: 4px;
  width: calc(50% - 4px);
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  border-radius: 100px;
  transition: transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.3);
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
  border-radius: 100px;
  color: var(--color-text-primary);
  font-weight: 600;
  font-size: 14px;
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
</style>
