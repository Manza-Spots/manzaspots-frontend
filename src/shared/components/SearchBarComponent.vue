<script setup>
import { ref, watch, nextTick } from 'vue'
import Icon from './Icon.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'search'])

const searchQuery = ref('')
const searchInput = ref(null)

const close = () => {
  searchQuery.value = ''
  emit('update:modelValue', false)
}

const handleSearch = () => {
  emit('search', searchQuery.value)
}

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen) {
      await nextTick()
      searchInput.value?.focus()
    }
  }
)
</script>

<template>
  <Transition name="search-expand">
    <div v-if="modelValue" class="search-bar-expanded">
      <button class="back-button" @click="close">
        <Icon name="ChevronLeft" :size="24" />
      </button>

      <div class="search-container">
        <Icon name="Search" :size="20" class="search-icon" />
        <input
          ref="searchInput"
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="Spots, rutas, ubicaciones..."
          @input="handleSearch"
        />
        <button v-if="searchQuery" class="clear-button" @click="searchQuery = ''">
          <Icon name="X" :size="18" />
        </button>
        <button class="mic-button">
          <Icon name="Mic" :size="20" />
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.search-bar-expanded {
  position: fixed;
  bottom: 10px;
  left: var(--space-4);
  right: var(--space-4);
  z-index: 101;
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.back-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 100px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: none;
  cursor: pointer;
  color: var(--color-text-primary);
  box-shadow:
    0 -4px 20px rgba(0, 0, 0, 0.08),
    0 0 1px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.back-button:active {
  transform: scale(0.95);
}

.search-container {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex: 1;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 100px;
  padding: var(--space-3) var(--space-4);
  box-shadow:
    0 -4px 20px rgba(0, 0, 0, 0.08),
    0 0 1px rgba(0, 0, 0, 0.1);
  min-height: 56px;
}

.search-icon {
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: var(--text-base);
  color: var(--color-text-primary);
  outline: none;
  min-width: 0;
}

.search-input::placeholder {
  color: var(--color-text-tertiary);
}

.clear-button,
.mic-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 100px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.clear-button:active,
.mic-button:active {
  transform: scale(0.9);
}

.mic-button {
  color: var(--color-text-tertiary);
}

/* Transición */
.search-expand-enter-active,
.search-expand-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.search-expand-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.search-expand-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

@media (prefers-color-scheme: dark) {
  .back-button,
  .search-container {
    background: rgba(28, 28, 30, 0.85);
  }
}
</style>
