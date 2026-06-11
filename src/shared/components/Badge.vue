<script setup>
import { computed } from 'vue'

defineOptions({
  name: 'BadgeComponent',
})

const props = defineProps({
  variant: {
    type: String,
    default: 'default',
    validator: (value) =>
      ['default', 'primary', 'secondary', 'success', 'warning', 'error', 'info'].includes(value),
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value),
  },
  rounded: {
    type: Boolean,
    default: false,
  },
  dot: {
    type: Boolean,
    default: false,
  },
})

const badgeClasses = computed(() => {
  return [
    'badge',
    `badge-${props.variant}`,
    `badge-${props.size}`,
    {
      'badge-rounded': props.rounded,
      'badge-dot': props.dot,
    },
  ]
})
</script>

<template>
  <span :class="badgeClasses">
    <span v-if="dot" class="badge-dot-indicator"></span>
    <slot />
  </span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-weight: var(--font-bold);
  border-radius: var(--radius-full);
  white-space: nowrap;
}

.badge-sm {
  padding: 2px var(--space-2);
  font-size: var(--text-xs);
}

.badge-md {
  padding: var(--space-1) var(--space-3);
  font-size: var(--text-sm);
}

.badge-lg {
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-base);
}

.badge-default {
  background-color: var(--color-surface-2);
  color: var(--color-text-secondary);
}

.badge-primary {
  background-color: var(--color-primary-tint);
  color: var(--color-primary);
}

.badge-secondary {
  background-color: var(--color-ocean-tint);
  color: var(--color-secondary);
}

.badge-success {
  background-color: var(--color-primary-tint);
  color: var(--color-success);
}

.badge-warning {
  background-color: var(--color-sand-tint);
  color: var(--color-warning);
}

.badge-error {
  background-color: var(--color-coral-tint);
  color: var(--color-error);
}

.badge-info {
  background-color: var(--color-ocean-tint);
  color: var(--color-info);
}

.badge-rounded {
  border-radius: var(--radius-full);
}

.badge-dot-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: currentColor;
}
</style>
