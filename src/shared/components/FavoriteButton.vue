<script setup>
import { ref, watch } from 'vue'
import Icon from './Icon.vue'
import IconButton from './IconButton.vue'

const props = defineProps({
  active: {
    type: Boolean,
    default: false,
  },
  size: {
    type: Number,
    default: 22,
  },

  onPhoto: {
    type: Boolean,
    default: false,
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

const emit = defineEmits(['toggle'])

const popping = ref(false)

watch(
  () => props.active,
  (isActive, wasActive) => {
    if (isActive && !wasActive) {
      popping.value = false
      requestAnimationFrame(() => {
        popping.value = true
      })
    }
  },
)
</script>

<template>
  <IconButton
    class="fav-btn"
    :class="{ 'is-active': active }"
    :variant="onPhoto ? 'on-photo' : 'surface'"
    :disabled="disabled"
    :aria-pressed="active"
    :label="label"
    @click.stop="emit('toggle')"
  >

    <span class="fav-icon" :class="{ 'is-popping': popping }" @animationend="popping = false">
      <Icon name="Heart" :size="size" />
    </span>
  </IconButton>
</template>

<style scoped>
.fav-btn.is-active {
  color: var(--color-coral);
}

.fav-icon {
  display: flex;
}

.fav-btn.is-active .fav-icon :deep(svg) {
  fill: currentColor;
}

.fav-icon.is-popping {
  animation: pop-bounce var(--bounce-pop) var(--ease-spring) forwards;
}
</style>
