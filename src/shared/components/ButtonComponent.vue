<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'outline', 'ghost', 'danger'].includes(value),
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value),
  },
  fullWidth: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['click'])

const handleClick = (event) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}

const buttonClasses = computed(() => {
  return [
    'btn',
    `btn-${props.variant}`,
    `btn-${props.size}`,
    {
      'btn-full': props.fullWidth,
      'btn-disabled': props.disabled,
      'btn-loading': props.loading,
    },
  ]
})
</script>

<template>
  <button :class="buttonClasses" :disabled="disabled || loading" @click="handleClick">
    <span v-if="loading" class="btn-spinner"></span>
    <slot v-else />
  </button>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  font-weight: var(--font-medium);
  border-radius: var(--radius-lg);
  transition: all var(--transition-fast);
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}

.btn:active:not(.btn-disabled) {
  transform: scale(0.98);
}

/* Sizes */
.btn-sm {
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  min-height: 32px;
}

.btn-md {
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-base);
  min-height: 40px;
}

.btn-lg {
  padding: var(--space-4) var(--space-6);
  font-size: var(--text-lg);
  min-height: 48px;
}

/* Variants */
.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-primary:hover:not(.btn-disabled) {
  background-color: var(--color-primary-dark);
}

.btn-secondary {
  background-color: var(--color-secondary);
  color: white;
}

.btn-secondary:hover:not(.btn-disabled) {
  background-color: var(--color-secondary-dark);
}

.btn-outline {
  background-color: transparent;
  color: var(--color-primary);
  border: 2px solid var(--color-primary);
}

.btn-outline:hover:not(.btn-disabled) {
  background-color: var(--color-primary);
  color: white;
}

.btn-ghost {
  background-color: transparent;
  color: var(--color-text-primary);
}

.btn-ghost:hover:not(.btn-disabled) {
  background-color: var(--color-gray-100);
}

.btn-danger {
  background-color: var(--color-error);
  color: white;
}

.btn-danger:hover:not(.btn-disabled) {
  background-color: #dc2626;
}

/* States */
.btn-full {
  width: 100%;
}

.btn-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-loading {
  position: relative;
  color: transparent;
  cursor: wait;
}

.btn-spinner {
  position: absolute;
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
