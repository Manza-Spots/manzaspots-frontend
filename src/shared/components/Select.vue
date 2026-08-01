<script setup>
import { computed } from 'vue'
import Icon from './Icon.vue'

defineOptions({
  name: 'SelectComponent',
})

const props = defineProps({
  modelValue: {
    type: [String, Number, Array],
    default: '',
  },
  options: {
    type: Array,
    required: true,
    // Formato: [{ label: 'Label', value: 'value' }] o ['value1', 'value2']
  },
  placeholder: {
    type: String,
    default: 'Seleccionar...',
  },
  label: {
    type: String,
    default: '',
  },
  error: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  multiple: {
    type: Boolean,
    default: false,
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value),
  },
})

const emit = defineEmits(['update:modelValue', 'change', 'blur'])

const normalizedOptions = computed(() => {
  return props.options.map((option) => {
    if (typeof option === 'object' && option !== null) {
      return option
    }
    return { label: String(option), value: option }
  })
})

const handleChange = (event) => {
  if (props.multiple) {
    const selected = Array.from(event.target.selectedOptions).map((opt) => opt.value)
    emit('update:modelValue', selected)
    emit('change', selected)
  } else {
    const value = event.target.value
    emit('update:modelValue', value)
    emit('change', value)
  }
}

const selectClasses = computed(() => {
  return [
    'select',
    `select-${props.size}`,
    {
      'select-error': props.error,
      'select-disabled': props.disabled,
    },
  ]
})
</script>

<template>
  <div class="select-wrapper">
    <label v-if="label" class="select-label">{{ label }}</label>

    <div class="select-container">
      <select
        :value="modelValue"
        :disabled="disabled"
        :multiple="multiple"
        :class="selectClasses"
        @change="handleChange"
        @blur="emit('blur')"
      >
        <option v-if="!multiple && placeholder" value="" disabled selected>
          {{ placeholder }}
        </option>
        <option v-for="option in normalizedOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>

      <div v-if="!multiple" class="select-icon">
        <Icon name="ChevronDown" :size="size === 'sm' ? 16 : size === 'lg' ? 20 : 18" />
      </div>
    </div>

    <p v-if="error" class="select-error-message">{{ error }}</p>
  </div>
</template>

<style scoped>
.select-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.select-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-primary);
}

.select-container {
  position: relative;
}

.select {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background-color: var(--color-bg);
  color: var(--color-text-primary);
  transition: all var(--transition-fast);
  font-family: var(--font-sans);
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
}

.select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--focus-ring);
}

.select:disabled {
  background-color: var(--color-surface-2);
  cursor: not-allowed;
  opacity: 0.6;
}

/* Sizes */
.select-sm {
  padding: var(--space-2) var(--space-3);
  padding-right: 36px;
  font-size: var(--text-sm);
  height: 36px;
}

.select-md {
  padding: var(--space-3) var(--space-4);
  padding-right: 40px;
  font-size: var(--text-sm);
  height: 44px;
}

.select-lg {
  padding: var(--space-4) var(--space-5);
  padding-right: 44px;
  font-size: var(--text-lg);
  height: 52px;
}

.select[multiple] {
  height: auto;
  min-height: 120px;
  padding-right: var(--space-4);
}

.select-icon {
  position: absolute;
  right: var(--space-3);
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
}

.select[multiple] + .select-icon {
  display: none;
}

/* Error state */
.select-error {
  border-color: var(--color-error);
}

.select-error:focus {
  border-color: var(--color-error);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.select-error-message {
  font-size: var(--text-sm);
  color: var(--color-error);
  margin: 0;
}
</style>
