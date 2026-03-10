<script setup>
import Icon from './Icon.vue'

defineOptions({
  name: 'ToastComponent',
})

defineProps({
  message: {
    type: String,
    required: true,
  },
  variant: {
    type: String,
    default: 'info',
    validator: (value) => ['info', 'success', 'warning', 'error'].includes(value),
  },
  closable: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['close'])

const variantIcons = {
  info: 'Info',
  success: 'Check',
  warning: 'AlertCircle',
  error: 'AlertCircle',
}
</script>

<template>
  <div :class="['toast', `toast-${variant}`]">
    <div class="toast-icon">
      <Icon :name="variantIcons[variant]" :size="20" />
    </div>

    <p class="toast-message">{{ message }}</p>

    <button v-if="closable" class="toast-close" @click="emit('close')">
      <Icon name="X" :size="16" />
    </button>
  </div>
</template>

<style scoped>
.toast {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  max-width: 500px;
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  animation: slideInTop 0.3s ease-out;
  backdrop-filter: blur(8px);
}

@keyframes slideInTop {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.toast-icon {
  display: flex;
  flex-shrink: 0;
}

.toast-message {
  flex: 1;
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
  word-break: break-word;
}

.toast-close {
  display: flex;
  flex-shrink: 0;
  padding: var(--space-1);
  border-radius: var(--radius-sm);
  opacity: 0.7;
  transition: all var(--transition-fast);
}

.toast-close:hover {
  opacity: 1;
  background-color: rgba(0, 0, 0, 0.1);
}

/* Variants */
.toast-info {
  background-color: rgba(239, 246, 255, 0.95);
  color: #1e40af;
  border: 1px solid #bfdbfe;
}

.toast-success {
  background-color: rgba(236, 253, 245, 0.95);
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.toast-warning {
  background-color: rgba(255, 251, 235, 0.95);
  color: #92400e;
  border: 1px solid #fde68a;
}

.toast-error {
  background-color: rgba(254, 242, 242, 0.95);
  color: #991b1b;
  border: 1px solid #fecaca;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .toast-info {
    background-color: rgba(30, 58, 138, 0.95);
    color: #bfdbfe;
    border-color: #1e40af;
  }

  .toast-success {
    background-color: rgba(6, 95, 70, 0.95);
    color: #a7f3d0;
    border-color: #065f46;
  }

  .toast-warning {
    background-color: rgba(146, 64, 14, 0.95);
    color: #fde68a;
    border-color: #92400e;
  }

  .toast-error {
    background-color: rgba(153, 27, 27, 0.95);
    color: #fecaca;
    border-color: #991b1b;
  }
}

@media (max-width: 640px) {
  .toast {
    max-width: none;
  }
}
</style>
