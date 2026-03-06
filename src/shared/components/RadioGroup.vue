<script setup>
import { provide, computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Number, Boolean],
    default: null,
  },
  name: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    default: '',
  },
  error: {
    type: String,
    default: '',
  },
  direction: {
    type: String,
    default: 'vertical',
    validator: (value) => ['vertical', 'horizontal'].includes(value),
  },
})

const emit = defineEmits(['update:modelValue', 'change'])

const handleChange = (value) => {
  emit('update:modelValue', value)
  emit('change', value)
}

provide('radioGroup', {
  name: props.name,
  modelValue: computed(() => props.modelValue),
  onChange: handleChange,
})
</script>

<template>
  <div class="radio-group">
    <label v-if="label" class="radio-group-label">{{ label }}</label>
    <div :class="['radio-group-options', `radio-group-${direction}`]">
      <slot />
    </div>
    <p v-if="error" class="radio-group-error">{{ error }}</p>
  </div>
</template>

<style scoped>
.radio-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.radio-group-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-primary);
}

.radio-group-options {
  display: flex;
  gap: var(--space-4);
}

.radio-group-vertical {
  flex-direction: column;
  gap: var(--space-3);
}

.radio-group-horizontal {
  flex-direction: row;
  flex-wrap: wrap;
}

.radio-group-error {
  font-size: var(--text-sm);
  color: var(--color-error);
  margin: 0;
}
</style>
