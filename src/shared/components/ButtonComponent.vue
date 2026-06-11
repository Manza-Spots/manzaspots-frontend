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
  font-weight: var(--font-bold);
  border-radius: var(--radius-lg);
  transition: transform 0.12s var(--ease-out), background var(--transition-fast),
    color var(--transition-fast), box-shadow var(--transition-fast);
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  -webkit-tap-highlight-color: transparent;
}

.btn:active:not(.btn-disabled) {
  transform: scale(0.97);
}

.btn-sm {
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
  min-height: 38px;
  border-radius: var(--radius-sm);
}

.btn-md {
  padding: var(--space-3) var(--space-5);
  font-size: var(--text-base);
  min-height: 50px;
}

.btn-lg {
  padding: var(--space-4) var(--space-6);
  font-size: var(--text-lg);
  min-height: 56px;
}

.btn-primary {
  background-color: var(--color-primary);
  color: var(--color-on-primary);
  box-shadow: var(--shadow-primary);
}

.btn-primary:active:not(.btn-disabled) {
  background-color: var(--color-primary-dark);
}

@media (hover: hover) {
  .btn-primary:hover:not(.btn-disabled) {
    background-color: var(--color-primary-dark);
  }
}

.btn-secondary {
  background-color: var(--color-surface-2);
  color: var(--color-text-primary);
}

@media (hover: hover) {
  .btn-secondary:hover:not(.btn-disabled) {
    background-color: var(--color-surface-3);
  }
}

.btn-outline {
  background-color: transparent;
  color: var(--color-primary);
  box-shadow: inset 0 0 0 1.5px var(--color-primary);
}

@media (hover: hover) {
  .btn-outline:hover:not(.btn-disabled) {
    background-color: var(--color-primary-tint);
  }
}

.btn-ghost {
  background-color: transparent;
  color: var(--color-text-primary);
}

@media (hover: hover) {
  .btn-ghost:hover:not(.btn-disabled) {
    background-color: var(--color-surface-2);
  }
}

.btn-danger {
  background-color: var(--color-coral);
  color: #fff;
}

@media (hover: hover) {
  .btn-danger:hover:not(.btn-disabled) {
    background-color: #c2433c;
  }
}

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
  border: 2px solid var(--color-on-primary);
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
