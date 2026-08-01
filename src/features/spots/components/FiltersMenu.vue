<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ButtonComponent from '@/shared/components/ButtonComponent.vue'
import { RADIUS_MIN_KM, RADIUS_MAX_KM, DEFAULT_RADIUS_KM } from '../utils/spotFilters'

const props = defineProps({
  filters: {
    type: Object,
    default: () => ({ radiusKm: 15 }),
  },
  onApply: {
    type: Function,
    default: null,
  },
})

const { t } = useI18n()

const pending = ref({ ...props.filters })

const apply = () => {
  props.onApply?.({ ...pending.value })
}
</script>

<template>
  <div class="filters-menu">
    <div class="radius-head">
      <span class="section-label">{{ t('spots.filters.radius') }}</span>
      <button
        v-if="pending.radiusKm !== DEFAULT_RADIUS_KM"
        type="button"
        class="reset-link"
        @click="pending.radiusKm = DEFAULT_RADIUS_KM"
      >
        {{ t('spots.filters.reset') }}
      </button>
    </div>
    <div class="radius-value">{{ pending.radiusKm }}<small> km</small></div>

    <input
      type="range"
      class="radius-slider"
      :min="RADIUS_MIN_KM"
      :max="RADIUS_MAX_KM"
      step="1"
      v-model.number="pending.radiusKm"
    />

    <div class="radius-scale">
      <span>{{ RADIUS_MIN_KM }} km</span>
      <span>{{ RADIUS_MAX_KM }} km</span>
    </div>

    <ButtonComponent variant="primary" size="lg" full-width @click="apply">
      {{ t('spots.filters.apply') }}
    </ButtonComponent>
  </div>
</template>

<style scoped>
.filters-menu {
  padding-bottom: var(--space-2);
}

.radius-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 24px;
  margin-bottom: var(--space-1);
}

.reset-link {
  background: none;
  border: none;
  padding: 4px 6px;
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  color: var(--color-primary);
  cursor: pointer;
}

.reset-link:active {
  opacity: 0.6;
}

.section-label {
  font-size: 11px;
  font-weight: var(--font-extrabold);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-text-tertiary);
}

.radius-value {
  font-size: var(--text-3xl);
  font-weight: var(--font-extrabold);
  color: var(--color-primary);
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
}

.radius-value small {
  font-size: 15px;
  font-weight: var(--font-bold);
  color: var(--color-text-secondary);
  margin-left: 2px;
}

.radius-slider {
  width: 100%;
  height: 28px;
  accent-color: var(--color-primary);
  cursor: pointer;
}

.radius-scale {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  font-weight: var(--font-bold);
  color: var(--color-text-tertiary);
  margin: var(--space-1) 0 var(--space-5);
}
</style>
