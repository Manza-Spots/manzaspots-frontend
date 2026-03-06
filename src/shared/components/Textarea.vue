<script setup>
import { ref, computed } from 'vue'

defineOptions({
  name: 'TextareaComponent',
})

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
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
  rows: {
    type: Number,
    default: 4,
  },
  maxLength: {
    type: Number,
    default: null,
  },
  showCount: {
    type: Boolean,
    default: false,
  },
  resize: {
    type: String,
    default: 'vertical',
    validator: (value) => ['none', 'vertical', 'horizontal', 'both'].includes(value),
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value),
  },
})

const emit = defineEmits(['update:modelValue', 'blur', 'focus'])

const textareaRef = ref(null)

const textareaClasses = computed(() => {
  return [
    'textarea',
    `textarea-${props.size}`,
    `textarea-resize-${props.resize}`,
    {
      'textarea-error': props.error,
      'textarea-disabled': props.disabled,
    },
  ]
})

const characterCount = computed(() => {
  if (!props.showCount) return null
  const current = props.modelValue?.length || 0
  return props.maxLength ? `${current}/${props.maxLength}` : current
})

const handleInput = (event) => {
  emit('update:modelValue', event.target.value)
}

const focus = () => {
  textareaRef.value?.focus()
}

defineExpose({ focus })
</script>

<template>
  <div class="textarea-wrapper">
    <div v-if="label || showCount" class="textarea-header">
      <label v-if="label" class="textarea-label">{{ label }}</label>
      <span v-if="showCount" class="textarea-count">
        {{ characterCount }}
      </span>
    </div>

    <textarea
      ref="textareaRef"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :rows="rows"
      :maxlength="maxLength"
      :class="textareaClasses"
      @input="handleInput"
      @focus="emit('focus', $event)"
      @blur="emit('blur', $event)"
    ></textarea>

    <p v-if="error" class="textarea-error-message">{{ error }}</p>
  </div>
</template>

<style scoped>
.textarea-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.textarea-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.textarea-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-primary);
}

.textarea-count {
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
  font-variant-numeric: tabular-nums;
}

.textarea {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background-color: var(--color-bg);
  color: var(--color-text-primary);
  transition: all var(--transition-fast);
  font-family: var(--font-sans);
  line-height: var(--leading-normal);
}

.textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.textarea:disabled {
  background-color: var(--color-gray-100);
  cursor: not-allowed;
  opacity: 0.6;
}

.textarea:read-only {
  background-color: var(--color-gray-50);
}

.textarea::placeholder {
  color: var(--color-text-tertiary);
}

/* Sizes */
.textarea-sm {
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
}

.textarea-md {
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-base);
}

.textarea-lg {
  padding: var(--space-4) var(--space-5);
  font-size: var(--text-lg);
}

/* Resize */
.textarea-resize-none {
  resize: none;
}

.textarea-resize-vertical {
  resize: vertical;
}

.textarea-resize-horizontal {
  resize: horizontal;
}

.textarea-resize-both {
  resize: both;
}

/* Error state */
.textarea-error {
  border-color: var(--color-error);
}

.textarea-error:focus {
  border-color: var(--color-error);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.textarea-error-message {
  font-size: var(--text-sm);
  color: var(--color-error);
  margin: 0;
}
</style>
