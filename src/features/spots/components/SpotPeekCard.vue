<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '@/shared/components/Icon.vue'

const props = defineProps({
  spot: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['open', 'close'])

const { t } = useI18n()

const failed = ref(false)
const showThumb = computed(() => props.spot.imageUrl && !failed.value)

watch(() => props.spot.id, () => {
  failed.value = false
})
</script>

<template>
  <div class="peek" role="button" @click="emit('open', spot.id)">
    <img
      v-if="showThumb"
      class="peek-thumb"
      :src="spot.imageUrl"
      :alt="spot.name"
      loading="lazy"
      @error="failed = true"
    />
    <div v-else class="peek-thumb peek-thumb--empty">
      <Icon name="MapPinned" :size="20" />
    </div>

    <div class="peek-text">
      <span class="peek-name">{{ spot.name }}</span>
      <span v-if="spot.distance" class="peek-dist">
        <Icon name="MapPin" :size="12" />
        {{ spot.distance }}
      </span>
      <span v-else-if="spot.description" class="peek-dist">{{ spot.description }}</span>
    </div>

    <button
      type="button"
      class="peek-close"
      :aria-label="t('common.buttons.close')"
      @click.stop="emit('close')"
    >
      <Icon name="X" :size="17" />
    </button>

    <span class="peek-open" aria-hidden="true">
      <Icon name="ChevronRight" :size="18" />
    </span>
  </div>
</template>

<style scoped>
.peek {
  position: absolute;
  left: var(--space-6);
  right: var(--space-6);
  bottom: 96px;
  max-width: 520px;
  margin: 0 auto;
  height: 56px;
  z-index: 40;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 6px;
  background: var(--glass-bg);
  -webkit-backdrop-filter: var(--blur);
  backdrop-filter: var(--blur);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-md);
  cursor: pointer;
  transition: var(--press-transition);
}

.peek:active {
  transform: scale(0.99);
}

.peek-thumb {
  flex: none;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-full);
  object-fit: cover;
  background: var(--color-surface-2);
}

.peek-thumb--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-tertiary);
}

.peek-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.peek-name {
  font-size: var(--text-sm);
  font-weight: var(--font-extrabold);
  color: var(--color-text-primary);
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.peek-dist {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.peek-close {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  color: var(--color-text-tertiary);
  transition: var(--press-transition), color var(--transition-fast);
}

.peek-close:active {
  transform: scale(var(--press-scale-strong));
  color: var(--color-text-primary);
}

.peek-open {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 32px;
  height: 32px;
  margin-right: 6px;
  border-radius: var(--radius-full);
  background: var(--color-primary-tint);
  color: var(--color-primary);
}
</style>
