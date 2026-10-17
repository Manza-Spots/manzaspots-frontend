<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '@/shared/components/Icon.vue'
import IconButton from '@/shared/components/IconButton.vue'
import ButtonComponent from '@/shared/components/ButtonComponent.vue'

const props = defineProps({
  routeName: {
    type: String,
    default: '',
  },
  // Sin rutas registradas, el botón principal invita a grabar la primera.
  hasRoutes: {
    type: Boolean,
    default: false,
  },
  canNavigate: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['start', 'directions'])

const { t } = useI18n()

const hasRoute = computed(() => !!props.routeName)
const canStart = computed(() => hasRoute.value || !props.hasRoutes)
const label = computed(() => {
  if (hasRoute.value) return t('spots.detail.startRoute', { name: props.routeName })
  return props.hasRoutes ? t('spots.detail.pickRoute') : t('spots.detail.recordFirst')
})
</script>

<template>
  <div class="action-bar">
    <div class="action-row">
      <ButtonComponent
        class="action-start"
        :variant="canStart ? 'primary' : 'secondary'"
        size="lg"
        :disabled="!canStart"
        @click="emit('start')"
      >
        <Icon :name="hasRoute ? 'Navigation' : 'Radio'" :size="18" />
        <span class="action-label">{{ label }}</span>
      </ButtonComponent>

      <IconButton
        :label="t('spots.detail.directions')"
        :disabled="!canNavigate"
        @click="emit('directions')"
      >
        <Icon name="Navigation2" :size="20" />
      </IconButton>
    </div>
  </div>
</template>

<style scoped>
.action-bar {
  position: relative;
  padding: var(--space-4) var(--space-6) var(--bottom-bar-padding);

  background: var(--color-bg);
}

.action-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  max-width: 520px;
  margin: 0 auto;
}

.action-bar::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 100%;
  height: var(--space-6);
  background: linear-gradient(to top, var(--color-bg), transparent);
  pointer-events: none;
}

.action-start {
  flex: 1;
  min-width: 0;
  border-radius: var(--radius-full);
}

.action-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.action-bar :deep(.icon-btn) {
  width: 56px;
  height: 56px;
  flex: none;
}
</style>
