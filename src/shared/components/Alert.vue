<script setup>
import Icon from './Icon.vue'

defineOptions({
  name: 'AlertComponent',
})

const props = defineProps({
  variant: {
    type: String,
    default: 'info',
    validator: (value) => ['info', 'success', 'warning', 'error'].includes(value),
  },
  title: {
    type: String,
    default: '',
  },
  closable: {
    type: Boolean,
    default: false,
  },
  icon: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['close'])

const variantIcons = {
  info: 'Info',
  success: 'Check',
  warning: 'AlertCircle',
  error: 'AlertCircle',
}

const displayIcon = props.icon || variantIcons[props.variant]
</script>

<template>
  <div :class="['alert', `alert-${variant}`]">
    <div class="alert-icon">
      <Icon :name="displayIcon" :size="20" />
    </div>

    <div class="alert-content">
      <h4 v-if="title" class="alert-title">{{ title }}</h4>
      <div class="alert-message">
        <slot />
      </div>
    </div>

    <button v-if="closable" class="alert-close" @click="emit('close')">
      <Icon name="X" :size="18" />
    </button>
  </div>
</template>

<style scoped>
.alert {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  border-left: 4px solid;
}

.alert-icon {
  display: flex;
  align-items: flex-start;
  flex-shrink: 0;
  padding-top: 2px;
}

.alert-content {
  flex: 1;
  min-width: 0;
}

.alert-title {
  margin: 0 0 var(--space-1) 0;
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
}

.alert-message {
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}

.alert-close {
  display: flex;
  align-items: flex-start;
  padding: 0;
  flex-shrink: 0;
  color: currentColor;
  opacity: 0.7;
  transition: opacity var(--transition-fast);
}

.alert-close:hover {
  opacity: 1;
}

/* Variants */
.alert-info {
  background-color: rgba(59, 130, 246, 0.1);
  border-left-color: var(--color-info);
  color: #1e40af;
}

.alert-success {
  background-color: rgba(16, 185, 129, 0.1);
  border-left-color: var(--color-success);
  color: #065f46;
}

.alert-warning {
  background-color: rgba(245, 158, 11, 0.1);
  border-left-color: var(--color-warning);
  color: #92400e;
}

.alert-error {
  background-color: rgba(239, 68, 68, 0.1);
  border-left-color: var(--color-error);
  color: #991b1b;
}
</style>
