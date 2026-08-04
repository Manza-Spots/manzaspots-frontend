<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '@/shared/components/Icon.vue'
import SegmentedControl from '@/shared/components/SegmentedControl.vue'
import { useImmersiveMode } from '@/shared/composables/useImmersiveMode'

const props = defineProps({
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

const { t } = useI18n()
const { isImmersive } = useImmersiveMode()

const emit = defineEmits(['update:currentView', 'locate', 'filter'])

const viewOptions = computed(() => [
  { value: 'map', icon: 'Map', ariaLabel: t('spots.view.map') },
  { value: 'list', icon: 'List', ariaLabel: t('spots.view.list') },
])

// Sobre la foto (modo lista inmersivo) el control cambia a vidrio claro.
const toggleVariant = computed(() => (props.currentView === 'list' ? 'on-photo' : 'glass'))
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
      <SegmentedControl
        :model-value="currentView"
        :options="viewOptions"
        :variant="toggleVariant"
        @update:model-value="emit('update:currentView', $event)"
      />
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
  background: var(--color-bg);
  border: 1px solid var(--hairline);
  box-shadow: var(--shadow-md);
  color: var(--color-text-primary);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: var(--press-transition);
}

.header-fab-btn:active {
  transform: scale(var(--press-scale-strong));
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

/* Vidrio sobre foto: la vista inmersiva (lista) renderiza el header sobre la
   imagen. Los tokens --on-photo-* lo mantienen igual al toggle y al navbar, y
   son los que cambian con el tema. */
.is-list-mode .header-fab-btn {
  background: var(--on-photo-bg);
  -webkit-backdrop-filter: var(--on-photo-blur);
  backdrop-filter: var(--on-photo-blur);
  border-color: var(--on-photo-border);
  box-shadow: none;
  color: var(--on-photo-text);
}

</style>
