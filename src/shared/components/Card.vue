<script setup>
import { computed } from 'vue'

defineOptions({
  name: 'CardComponent',
})

const props = defineProps({
  padding: {
    type: String,
    default: 'md',
    validator: (value) => ['none', 'sm', 'md', 'lg'].includes(value),
  },
  shadow: {
    type: String,
    default: 'md',
    validator: (value) => ['none', 'sm', 'md', 'lg', 'xl'].includes(value),
  },
  hover: {
    type: Boolean,
    default: false,
  },
  bordered: {
    type: Boolean,
    default: false,
  },
})

const cardClasses = computed(() => {
  return [
    'card',
    `card-padding-${props.padding}`,
    `card-shadow-${props.shadow}`,
    {
      'card-hover': props.hover,
      'card-bordered': props.bordered,
    },
  ]
})
</script>

<template>
  <div :class="cardClasses">
    <slot />
  </div>
</template>

<style scoped>
.card {
  background-color: var(--color-bg);
  border-radius: var(--radius-xl);
  transition: all var(--transition-fast);
}

/* Padding */
.card-padding-none {
  padding: 0;
}

.card-padding-sm {
  padding: var(--space-3);
}

.card-padding-md {
  padding: var(--space-4);
}

.card-padding-lg {
  padding: var(--space-6);
}

/* Shadows */
.card-shadow-none {
  box-shadow: none;
}

.card-shadow-sm {
  box-shadow: var(--shadow-sm);
}

.card-shadow-md {
  box-shadow: var(--shadow-md);
}

.card-shadow-lg {
  box-shadow: var(--shadow-lg);
}

.card-shadow-xl {
  box-shadow: var(--shadow-xl);
}

/* Hover effect */
.card-hover {
  cursor: pointer;
}

.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-xl);
}

/* Border */
.card-bordered {
  border: 1px solid var(--color-border);
}
</style>
