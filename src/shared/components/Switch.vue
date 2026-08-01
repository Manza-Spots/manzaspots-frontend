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
  background-color: var(--color-surface-3);
  transition: background-color var(--transition-base);
  flex-shrink: 0;
}

.switch-track-active {
  background-color: var(--color-primary);
}

.switch-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  background-color: white;
  border-radius: 50%;
  transition: transform 0.22s var(--ease-spring);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.25);
}

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
  width: 52px;
  height: 32px;
}

.switch-md .switch-thumb {
  width: 26px;
  height: 26px;
}

.switch-md .switch-thumb-active {
  transform: translateX(20px);
}

.switch-lg .switch-track {
  width: 60px;
  height: 36px;
}

.switch-lg .switch-thumb {
  width: 30px;
  height: 30px;
}

.switch-lg .switch-thumb-active {
  transform: translateX(24px);
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

.switch-input:focus-visible + .switch-track {
  box-shadow: var(--focus-ring);
}

.switch-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.switch-label {
  color: var(--color-text-primary);
}
</style>
