<script setup>
import { computed, ref } from 'vue'
import Icon from './Icon.vue'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: '',
  },
  type: {
    type: String,
    default: 'text',
  },
  placeholder: {
    type: String,
    default: '',
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
  readonly: {
    type: Boolean,
    default: false,
  },
  icon: {
    type: String,
    default: '',
  },
  iconRight: {
    type: String,
    default: '',
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value),
  },
  iconRightSize: {
    type: Number,
    default: 18,
  },
})

const emit = defineEmits(['update:modelValue', 'blur', 'focus', 'iconClick'])

const inputRef = ref(null)
const isFocused = ref(false)

const inputClasses = computed(() => {
  return [
    'input',
    `input-${props.size}`,
    {
      'input-error': props.error,
      'input-disabled': props.disabled,
      'input-with-icon': props.icon,
      'input-with-icon-right': props.iconRight,
    },
  ]
})

const handleInput = (event) => {
  emit('update:modelValue', event.target.value)
}

const handleFocus = (event) => {
  isFocused.value = true
  emit('focus', event)
}

const handleBlur = (event) => {
  isFocused.value = false
  emit('blur', event)
}

const handleIconClick = () => {
  emit('iconClick')
  inputRef.value?.focus()
}

const focus = () => {
  inputRef.value?.focus()
}

defineExpose({ focus })
</script>

<template>
  <div class="input-wrapper">
    <label v-if="label" class="input-label">
      {{ label }}
    </label>

    <div class="input-container">
      <div v-if="icon" class="input-icon input-icon-left" @click="handleIconClick">
        <Icon :name="icon" :size="size === 'sm' ? 16 : size === 'lg' ? 20 : 18" />
      </div>

      <input
        ref="inputRef"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :class="[
          inputClasses,
          { 'input-password': type === 'password' }
        ]"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
      />

      <div v-if="iconRight" class="input-icon input-icon-right" @click="emit('iconClick')">
        <Icon :name="iconRight" :size=" iconRightSize || (size === 'sm' ? 16 : size === 'lg' ? 20 : 18)" />
      </div>
    </div>

    <p v-if="error" class="input-error-message">
      {{ error }}
    </p>
  </div>
</template>

<style scoped>
.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.input-label {
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
  color: var(--color-text-secondary);
}

.input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.input {
  width: 100%;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-lg);
  background-color: var(--color-surface);
  color: var(--color-text-primary);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  font-family: var(--font-sans);
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px var(--color-primary-tint);
}

.input:disabled {
  background-color: var(--color-surface-2);
  cursor: not-allowed;
  opacity: 0.6;
}

.input:read-only {
  background-color: var(--color-surface-2);
}

.input::placeholder {
  color: var(--color-text-tertiary);
}

.input-sm {
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  height: 36px;
}

.input-md {
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-base);
  height: 52px;
}

.input-lg {
  padding: var(--space-4) var(--space-5);
  font-size: var(--text-lg);
  height: 56px;
}

.input-with-icon {
  padding-left: var(--space-10);
}

.input-with-icon-right {
  padding-right: var(--space-10);
}

.input-icon {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: color var(--transition-fast);
}

.input-icon-left {
  left: var(--space-3);
}

.input-icon-right {
  right: var(--space-3);
  padding-top: var(--space-3);
  padding-bottom: var(--space-3);
}

.input-error {
  border-color: var(--color-error);
}

.input-error:focus {
  border-color: var(--color-error);
  box-shadow: 0 0 0 4px var(--color-coral-tint);
}

.input-error-message {
  font-size: var(--text-sm);
  color: var(--color-error);
  margin: 0;
}

.input-password {
  letter-spacing: 2px;
  font-size: var(--text-sm);
}
</style>
