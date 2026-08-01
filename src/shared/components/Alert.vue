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

/* Variants — tints y deeps de la paleta manzanillo */
.alert-info {
  background-color: var(--color-ocean-tint);
  border-left-color: var(--color-info);
  color: var(--color-mar-deep);
}

.alert-success {
  background-color: var(--color-primary-tint);
  border-left-color: var(--color-success);
  color: var(--color-selva-deep);
}

.alert-warning {
  background-color: var(--color-sand-tint);
  border-left-color: var(--color-warning);
  color: var(--color-arena-deep);
}

.alert-error {
  background-color: var(--color-coral-tint);
  border-left-color: var(--color-error);
  color: var(--color-coral-deep);
}
</style>
