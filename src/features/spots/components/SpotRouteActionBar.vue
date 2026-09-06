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
})

const { t } = useI18n()

const hasRoute = computed(() => !!props.routeName)
</script>

<template>
  <div class="action-bar">
    <div class="action-row">

      <ButtonComponent
        class="action-start"
        :variant="hasRoute ? 'primary' : 'secondary'"
        size="lg"
        :disabled="!hasRoute"
      >
        <Icon name="Play" :size="18" />
        <span class="action-label">
          {{ hasRoute ? t('spots.detail.startRoute', { name: routeName }) : t('spots.detail.pickRoute') }}
        </span>
      </ButtonComponent>

      <IconButton :label="t('spots.detail.directions')" :disabled="!hasRoute">
        <Icon name="Navigation2" :size="20" />
      </IconButton>
    </div>
  </div>
</template>

<style scoped>
.action-bar {
  position: relative;
  padding: var(--space-4) var(--space-6) var(--space-6);

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
