<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '@/shared/components/Icon.vue'
import { useKeyboard } from '@/shared/composables/useKeyboard'

const props = defineProps({
  spots: {
    type: Array,
    default: () => [],
  },
  query: {
    type: String,
    default: '',
  },
  loading: {
    type: Boolean,
    default: false,
  },
  focusedId: {
    type: [Number, String],
    default: null,
  },
})

const emit = defineEmits(['select'])

const { t } = useI18n()
const { keyboardHeight } = useKeyboard()

// El panel se ancla con el MISMO offset fijo que el navbar (sin safe-area, que
// varía por dispositivo) para un gap consistente en iPhone y web; sube junto
// con el teclado. La altura la limita la lista (3 resultados + scroll).
const panelStyle = computed(() => ({
  bottom: `calc(${keyboardHeight.value}px + 96px)`,
}))

const countLabel = computed(() =>
  props.spots.length === 1
    ? t('spots.search.one')
    : t('spots.search.many', { count: props.spots.length }),
)
</script>

<template>
  <div class="search-results" :style="panelStyle">
    <div class="results-head">
      <span v-if="loading">{{ t('spots.search.loading') }}</span>
      <span v-else-if="!spots.length">{{ t('spots.search.empty', { query }) }}</span>
      <span v-else>{{ countLabel }}</span>
    </div>

    <ul v-if="spots.length" class="results-list">
      <li
        v-for="spot in spots"
        :key="spot.id"
        class="result-item"
        :class="{ 'is-focused': spot.id === focusedId }"
        @click="emit('select', spot.id)"
      >
        <img
          v-if="spot.imageUrl"
          :src="spot.imageUrl"
          :alt="spot.name"
          class="result-thumb"
          loading="lazy"
        />
        <div class="result-text">
          <span class="result-name">{{ spot.name }}</span>
          <span v-if="spot.distance" class="result-dist">
            <Icon name="MapPin" :size="12" />
            {{ spot.distance }}
          </span>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.search-results {
  position: absolute;
  left: var(--space-4);
  right: var(--space-4);
  z-index: 40;
  background: var(--glass-bg);
  -webkit-backdrop-filter: var(--blur);
  backdrop-filter: var(--blur);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: bottom 0.25s ease;
}

.results-head {
  padding: var(--space-2) var(--space-4);
  font-size: 12px;
  font-weight: var(--font-bold);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-text-tertiary);
  border-bottom: 1px solid var(--hairline);
  flex-shrink: 0;
}

.results-list {
  list-style: none;
  margin: 0;
  padding: var(--space-2);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  /* Alto para ~3 resultados (cada fila ~60px); el resto hace scroll. */
  max-height: 192px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: background 0.15s ease;
}

.result-item:active {
  transform: scale(0.99);
}

.result-item.is-focused {
  background: var(--color-primary-tint);
}

@media (hover: hover) {
  .result-item:not(.is-focused):hover {
    background: var(--color-surface-2);
  }
}

.result-thumb {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  object-fit: cover;
  flex-shrink: 0;
}

.result-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.result-name {
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-dist {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--color-primary);
  margin-top: 1px;
}
</style>
