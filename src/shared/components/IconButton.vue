<script setup>
defineProps({
  variant: {
    type: String,
    default: 'surface',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  label: {
    type: String,
    default: '',
  },
})

defineEmits(['click'])
</script>

<template>
  <button
    type="button"
    class="icon-btn"
    :class="variant === 'on-photo' ? 'is-on-photo' : 'is-surface'"
    :disabled="disabled"
    :aria-label="label"
    @click="$emit('click', $event)"
  >
    <slot></slot>
  </button>
</template>

<style scoped>
.icon-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border-radius: var(--radius-full);
  color: var(--color-text-primary);
  cursor: pointer;
  transition: var(--press-transition), background-color var(--transition-fast),
    color var(--transition-fast);
}

.icon-btn:active:not(:disabled) {
  transform: scale(var(--press-scale-strong));
}

.icon-btn:disabled {
  opacity: 0.6;
}

.icon-btn.is-surface {
  background: var(--color-bg);
  border: 1px solid var(--hairline);
  box-shadow: var(--shadow-md);
}

.icon-btn.is-on-photo {
  background: var(--on-photo-bg);
  border: 1px solid var(--on-photo-border);
  -webkit-backdrop-filter: var(--on-photo-blur);
  backdrop-filter: var(--on-photo-blur);
  box-shadow: var(--on-photo-shadow);
  color: var(--on-photo-text);
}
</style>
