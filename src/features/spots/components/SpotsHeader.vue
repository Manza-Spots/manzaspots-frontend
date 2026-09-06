<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '@/shared/components/Icon.vue'
import IconButton from '@/shared/components/IconButton.vue'
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
      <IconButton
        v-if="!isImmersive"
        class="header-fab-btn"
        :class="{ 'is-loading': isLocating }"
        :variant="currentView === 'list' ? 'on-photo' : 'surface'"
        :label="t('spots.actions.locate')"
        @click="emit('locate')"
      >
        <Icon name="LocateFixed" :size="24" class="icon-svg" />
      </IconButton>
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
      <IconButton
        v-if="!isImmersive"
        class="header-fab-btn"
        :variant="currentView === 'list' ? 'on-photo' : 'surface'"
        :label="t('spots.filters.title')"
        @click="emit('filter')"
      >
        <Icon name="SlidersHorizontal" :size="24" class="icon-svg" />
        <span v-if="hasActiveFilters" class="filter-dot"></span>
      </IconButton>
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

.is-list-mode .header-fab-btn {
  box-shadow: none;
}

</style>
