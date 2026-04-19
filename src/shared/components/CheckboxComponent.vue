<script setup>
import { computed } from 'vue'
import Icon from './Icon.vue'

const props = defineProps({
  modelValue: {
    type: [Boolean, Array],
    default: false,
  },
  value: {
    type: [String, Number, Boolean],
    default: null,
  },
  label: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: '',
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value),
  },
})

const emit = defineEmits(['update:modelValue', 'change'])

const isChecked = computed(() => {
  if (Array.isArray(props.modelValue)) {
    return props.modelValue.includes(props.value)
  }
  return props.modelValue
})

const handleChange = (event) => {
  const checked = event.target.checked

  if (Array.isArray(props.modelValue)) {
    const newValue = [...props.modelValue]
    if (checked) {
      newValue.push(props.value)
    } else {
      const index = newValue.indexOf(props.value)
      if (index > -1) {
        newValue.splice(index, 1)
      }
    }
    emit('update:modelValue', newValue)
    emit('change', newValue)
  } else {
    emit('update:modelValue', checked)
    emit('change', checked)
  }
}

const checkboxClasses = computed(() => {
  return [
    'checkbox-wrapper',
    `checkbox-${props.size}`,
    {
      'checkbox-disabled': props.disabled,
      'checkbox-error': props.error,
    },
  ]
})
</script>

<template>
  <div :class="checkboxClasses">
    <label class="checkbox-label">
      <input
        type="checkbox"
        :checked="isChecked"
        :value="value"
        :disabled="disabled"
        class="checkbox-input"
        @change="handleChange"
      />
      <span class="checkbox-box">
        <Icon v-if="isChecked" name="Check" :size="size === 'sm' ? 12 : size === 'lg' ? 18 : 14" />
      </span>

      <!-- Label con soporte para slot -->
      <span v-if="label || $slots.default" class="checkbox-text">
        <slot>{{ label }}</slot>
      </span>
    </label>
    <p v-if="error" class="checkbox-error-message">{{ error }}</p>
  </div>
</template>

<style scoped>
.checkbox-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  cursor: pointer;
  user-select: none;
}

.checkbox-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.checkbox-box {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm);
  background-color: var(--color-bg);
  transition: all var(--transition-fast);
  flex-shrink: 0;
  margin-top: 2px;
}

/* Sizes */
.checkbox-sm .checkbox-box {
  width: 16px;
  height: 16px;
}

.checkbox-md .checkbox-box {
  width: 20px;
  height: 20px;
}

.checkbox-lg .checkbox-box {
  width: 24px;
  height: 24px;
}

.checkbox-sm .checkbox-text {
  font-size: var(--text-sm);
}

.checkbox-md .checkbox-text {
  font-size: var(--text-base);
}

.checkbox-lg .checkbox-text {
  font-size: var(--text-lg);
}

/* States */
.checkbox-input:checked + .checkbox-box {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
}

.checkbox-input:focus + .checkbox-box {
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

@media (hover: hover) {
  .checkbox-label:hover .checkbox-box {
    border-color: var(--color-primary);
  }
}

.checkbox-label:active .checkbox-box {
  background-color: var(--color-gray-100);
}

.checkbox-disabled .checkbox-label {
  opacity: 0.5;
  cursor: not-allowed;
}

.checkbox-error .checkbox-box {
  border-color: var(--color-error);
}

.checkbox-text {
  color: var(--color-text-primary);
  line-height: var(--leading-normal);
  flex: 1;
}

.checkbox-error-message {
  font-size: var(--text-sm);
  color: var(--color-error);
  margin: 0;
  padding-left: calc(20px + var(--space-2));
}
</style>
