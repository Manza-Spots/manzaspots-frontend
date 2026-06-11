<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '@/shared/components/Icon.vue'
import ButtonComponent from '@/shared/components/ButtonComponent.vue'
import {
  CATEGORY_FILTERS,
  DISTANCE_FILTERS,
  filterSpots,
} from '../utils/spotFilters'

const props = defineProps({
  spots: {
    type: Array,
    default: () => [],
  },
  filters: {
    type: Object,
    default: () => ({ category: 'all', distance: 'all' }),
  },
  onApply: {
    type: Function,
    default: null,
  },
})

const { t } = useI18n()

const pending = ref({ ...props.filters })

const resultCount = computed(() => filterSpots(props.spots, pending.value).length)

const apply = () => {
  props.onApply?.({ ...pending.value })
}
</script>

<template>
  <div class="filters-menu">
    <p class="section-label">{{ t('spots.filters.category') }}</p>
    <div class="chips-container">
      <button
        v-for="cat in CATEGORY_FILTERS"
        :key="cat.key"
        class="chip-btn"
        :class="{ 'is-active': pending.category === cat.key }"
        @click="pending.category = cat.key"
      >
        <Icon :name="cat.icon" :size="14" />
        {{ t(`spots.filters.categories.${cat.key}`) }}
      </button>
    </div>

    <p class="section-label">{{ t('spots.filters.distance') }}</p>
    <div class="chips-container">
      <button
        v-for="dist in DISTANCE_FILTERS"
        :key="dist.key"
        class="chip-btn"
        :class="{ 'is-active': pending.distance === dist.key }"
        @click="pending.distance = dist.key"
      >
        {{ t(`spots.filters.distances.${dist.key}`) }}
      </button>
    </div>

    <ButtonComponent variant="primary" size="lg" full-width @click="apply">
      {{ t('spots.filters.apply', { count: resultCount }) }}
    </ButtonComponent>
  </div>
</template>

<style scoped>
.filters-menu {
  padding-bottom: var(--space-2);
}

.section-label {
  font-size: 11px;
  font-weight: var(--font-extrabold);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-text-tertiary);
  margin: var(--space-1) 0 var(--space-3);
}

.chips-container {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  margin-bottom: var(--space-5);
}

.chip-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 15px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: 13.5px;
  font-weight: var(--font-semibold);
  transition: all 0.15s ease;
  cursor: pointer;
}

.chip-btn:active {
  transform: scale(0.96);
}

.chip-btn.is-active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-on-primary);
}

@media (hover: hover) {
  .chip-btn:not(.is-active):hover {
    background: var(--color-primary-tint);
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
}
</style>
