<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '@/shared/components/Icon.vue'
import SpotListCard from '@/features/spots/components/SpotListCard.vue'
import RouteCard from './RouteCard.vue'

const props = defineProps({
  spots: {
    type: Array,
    default: () => [],
  },
  // null => no se muestra el tab de rutas (p. ej. "Mis spots").
  routes: {
    type: Array,
    default: null,
  },
})

const { t } = useI18n()

const hasTabs = computed(() => Array.isArray(props.routes))
const tab = ref('spots')
</script>

<template>
  <div class="list-sheet">
    <div v-if="hasTabs" class="tabs">
      <button class="tab" :class="{ active: tab === 'spots' }" @click="tab = 'spots'">
        {{ t('profile.tabs.spots') }} ({{ spots.length }})
      </button>
      <button class="tab" :class="{ active: tab === 'routes' }" @click="tab = 'routes'">
        {{ t('profile.tabs.routes') }} ({{ routes.length }})
      </button>
    </div>

    <div class="list">
      <template v-if="!hasTabs || tab === 'spots'">
        <SpotListCard v-for="s in spots" :key="s.id" :spot="s" />
        <div v-if="!spots.length" class="empty">
          <Icon name="MapPinned" :size="34" />
          <p>{{ t('profile.emptySpots') }}</p>
        </div>
      </template>

      <template v-else>
        <RouteCard v-for="r in routes" :key="r.id" :route="r" />
        <div v-if="!routes.length" class="empty">
          <Icon name="Route" :size="34" />
          <p>{{ t('profile.emptyRoutes') }}</p>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.list-sheet {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.tabs {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: var(--color-surface-2);
  border-radius: var(--radius-full);
  margin-bottom: var(--space-4);
}

.tab {
  flex: 1;
  padding: 9px 12px;
  border: none;
  background: transparent;
  border-radius: var(--radius-full);
  font-size: 13.5px;
  font-weight: var(--font-bold);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.tab.active {
  background: var(--color-surface);
  color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.list {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  max-height: 60vh;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-8) 0;
  color: var(--color-text-tertiary);
  text-align: center;
}

.empty p {
  margin: 0;
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
}
</style>
