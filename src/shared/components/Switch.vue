<script setup>
import { computed } from 'vue'

defineOptions({
  name: 'SwitchComponent',
})

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  label: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value),
  },
})

const emit = defineEmits(['update:modelValue', 'change'])

const handleChange = (event) => {
  const checked = event.target.checked
  emit('update:modelValue', checked)
  emit('change', checked)
}

const switchClasses = computed(() => {
  return [
    'switch-wrapper',
    `switch-${props.size}`,
    {
      'switch-disabled': props.disabled,
    },
  ]
})
</script>

<template>
  <label :class="switchClasses">
    <input
      type="checkbox"
      :checked="modelValue"
      :disabled="disabled"
      class="switch-input"
      @change="handleChange"
    />
    <span :class="['switch-track', { 'switch-track-active': modelValue }]">
      <span :class="['switch-thumb', { 'switch-thumb-active': modelValue }]"></span>
    </span>
    <span v-if="label" class="switch-label">{{ label }}</span>
  </label>
</template>

<style scoped>
.switch-wrapper {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  user-select: none;
}

.switch-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.switch-track {
  position: relative;
  display: inline-block;
  border-radius: var(--radius-full);
  background-color: var(--color-gray-300);
  transition: background-color var(--transition-fast);
  flex-shrink: 0;
}

.switch-track-active {
  background-color: var(--color-primary);
}

.switch-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  background-color: white;
  border-radius: 50%;
  transition: transform var(--transition-fast);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* Sizes */
.switch-sm .switch-track {
  width: 32px;
  height: 18px;
}

.switch-sm .switch-thumb {
  width: 14px;
  height: 14px;
}

.switch-sm .switch-thumb-active {
  transform: translateX(14px);
}

.switch-md .switch-track {
  width: 44px;
  height: 24px;
}

.switch-md .switch-thumb {
  width: 20px;
  height: 20px;
}

.switch-md .switch-thumb-active {
  transform: translateX(20px);
}

.switch-lg .switch-track {
  width: 56px;
  height: 30px;
}

.switch-lg .switch-thumb {
  width: 26px;
  height: 26px;
}

.switch-lg .switch-thumb-active {
  transform: translateX(26px);
}

.switch-sm .switch-label {
  font-size: var(--text-sm);
}

.switch-md .switch-label {
  font-size: var(--text-base);
}

.switch-lg .switch-label {
  font-size: var(--text-lg);
}

/* States */
.switch-input:focus + .switch-track {
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.switch-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.switch-label {
  color: var(--color-text-primary);
}
</style>
