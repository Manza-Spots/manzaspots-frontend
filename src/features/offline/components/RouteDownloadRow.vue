<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '@/shared/components/Icon.vue'
import { formatBytes } from '@/features/offline/composables/useRouteDownload'

const props = defineProps({
  // idle · downloading · saved
  status: {
    type: String,
    default: 'idle',
  },
  progress: {
    type: Object,
    default: () => ({ done: 0, total: 0, bytes: 0 }),
  },
  savedBytes: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['download', 'remove'])

const { t } = useI18n()

const fraction = computed(() =>
  props.progress.total ? Math.min(props.progress.done / props.progress.total, 1) : 0
)
</script>

<template>
  <div class="download-row" :class="`is-${status}`">
    <button v-if="status === 'idle'" type="button" class="download-main" @click="emit('download')">
      <Icon name="Download" :size="16" />
      <span class="download-label">{{ t('offline.download') }}</span>
    </button>

    <div v-else-if="status === 'downloading'" class="download-main" role="status">
      <Icon name="Download" :size="16" />
      <span class="download-label">
        {{ t('offline.downloading', { percent: Math.round(fraction * 100) }) }}
      </span>
      <span class="download-size">{{ formatBytes(progress.bytes) }}</span>
    </div>

    <template v-else>
      <div class="download-main">
        <Icon name="CheckCircle" :size="16" />
        <span class="download-label">{{ t('offline.saved') }}</span>
        <span class="download-size">{{ formatBytes(savedBytes) }}</span>
      </div>
      <button type="button" class="download-remove" @click="emit('remove')">
        <Icon name="Trash2" :size="14" />
        {{ t('offline.remove') }}
      </button>
    </template>

    <div v-if="status === 'downloading'" class="download-bar">
      <span :style="{ width: `${fraction * 100}%` }"></span>
    </div>
  </div>
</template>

<style scoped>
.download-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-1) var(--space-3);
  max-width: 520px;
  margin: 0 auto var(--space-3);
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
  color: var(--color-text-secondary);
}

.download-main {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: inherit;
  text-align: left;
}

button.download-main {
  color: var(--color-primary);
  transition: var(--press-transition);
}

button.download-main:active {
  transform: scale(var(--press-scale));
}

.is-saved .download-main :deep(svg) {
  color: var(--color-primary);
}

.download-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.download-main :deep(svg),
.download-remove :deep(svg) {
  flex: none;
}

.download-size {
  margin-left: auto;
  white-space: nowrap;
  color: var(--color-text-tertiary);
  font-variant-numeric: tabular-nums;
}

.download-remove {
  display: inline-flex;
  white-space: nowrap;
  align-items: center;
  gap: 4px;
  color: var(--color-coral);
  transition: var(--press-transition);
}

.download-remove:active {
  transform: scale(var(--press-scale));
}

/* Mismo riel que el avance en el modo Seguir. */
.download-bar {
  flex-basis: 100%;
  height: 6px;
  border-radius: var(--radius-full);
  background: var(--color-bg-tertiary);
  overflow: hidden;
}

.download-bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--color-primary);
  transition: width var(--transition-base);
}
</style>
