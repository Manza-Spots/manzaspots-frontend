<script setup>
import { computed } from 'vue'
import { icons } from '@/core/plugins/icons'

defineOptions({
  name: 'IconComponent',
})

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  size: {
    type: [Number, String],
    default: 24,
  },
  color: {
    type: String,
    default: 'currentColor',
  },
  strokeWidth: {
    type: [Number, String],
    default: 2,
  },
})

const IconComponent = computed(() => icons[props.name])
</script>

<template>
  <component
    :is="IconComponent"
    v-if="IconComponent"
    :size="size"
    :color="color"
    :stroke-width="strokeWidth"
  />
  <span v-else>⚠️</span>
</template>
