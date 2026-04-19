<script setup>
import { inject, computed } from 'vue'

defineOptions({
  name: 'RadioComponent',
})

const props = defineProps({
  modelValue: {
    type: [String, Number, Boolean],
    default: null,
  },
  value: {
    type: [String, Number, Boolean],
    required: true,
  },
  label: {
    type: String,
    default: '',
  },
  name: {
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

// Intentar obtener el contexto del RadioGroup
const radioGroup = inject('radioGroup', null)

// Determinar el modelValue y name a usar
const computedModelValue = computed(() => {
  return radioGroup ? radioGroup.modelValue.value : props.modelValue
})

const computedName = computed(() => {
  return radioGroup ? radioGroup.name : props.name
})

const isChecked = computed(() => {
  return computedModelValue.value === props.value
})

const handleChange = () => {
  if (!props.disabled) {
    if (radioGroup) {
      radioGroup.onChange(props.value)
    } else {
      emit('update:modelValue', props.value)
      emit('change', props.value)
    }
  }
}
</script>

<template>
  <label :class="['radio-wrapper', `radio-${size}`, { 'radio-disabled': disabled }]">
    <input
      type="radio"
      :name="computedName"
      :value="value"
      :checked="isChecked"
      :disabled="disabled"
      class="radio-input"
      @change="handleChange"
    />
    <span class="radio-circle">
      <span v-if="isChecked" class="radio-dot"></span>
    </span>
    <span v-if="label" class="radio-text">{{ label }}</span>
  </label>
</template>

<style scoped>
.radio-wrapper {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  user-select: none;
}

.radio-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.radio-circle {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--color-border);
  border-radius: 50%;
  background-color: var(--color-bg);
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.radio-dot {
  border-radius: 50%;
  background-color: var(--color-primary);
  transition: all var(--transition-fast);
}

/* Sizes */
.radio-sm .radio-circle {
  width: 16px;
  height: 16px;
}

.radio-sm .radio-dot {
  width: 8px;
  height: 8px;
}

.radio-md .radio-circle {
  width: 20px;
  height: 20px;
}

.radio-md .radio-dot {
  width: 10px;
  height: 10px;
}

.radio-lg .radio-circle {
  width: 24px;
  height: 24px;
}

.radio-lg .radio-dot {
  width: 12px;
  height: 12px;
}

.radio-sm .radio-text {
  font-size: var(--text-sm);
}

.radio-md .radio-text {
  font-size: var(--text-base);
}

.radio-lg .radio-text {
  font-size: var(--text-lg);
}

/* States */
.radio-input:checked + .radio-circle {
  border-color: var(--color-primary);
}

.radio-input:focus + .radio-circle {
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

@media (hover: hover) {
  .radio-wrapper:hover .radio-circle {
    border-color: var(--color-primary);
  }
}

.radio-wrapper:active .radio-circle {
  background-color: var(--color-gray-100);
}

.radio-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.radio-text {
  color: var(--color-text-primary);
}
</style>
