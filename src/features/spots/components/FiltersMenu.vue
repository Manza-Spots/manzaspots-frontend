<script setup>
import Icon from '@/shared/components/Icon.vue'

const categories = ['Miradores', 'Senderismo', 'MTB', 'Cascadas', 'Peligros']
</script>

<template>
  <div class="filters-bottom-sheet">
    <div class="filters-header">
      <Icon name="SlidersHorizontal" :size="24" class="icon-lucide" />
      <h3>Filtrar Spots</h3>
    </div>
    <div class="filters-content">
      <p class="subtitle">Categorías Temporales</p>
      <div class="chips-container">
        <button 
          v-for="cat in categories" 
          :key="cat"
          class="chip-btn"
        >
          {{ cat }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.filters-bottom-sheet {
  padding: var(--space-4) var(--space-4) calc(var(--safe-area-inset-bottom) + var(--space-6));
  background: var(--color-bg);
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
}

.filters-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
  color: var(--color-text-primary);
}

.filters-header h3 {
  margin: 0;
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
}

.icon-lucide {
  color: var(--color-primary);
}

.subtitle {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-3);
}

.chips-container {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.chip-btn {
  padding: var(--space-2) var(--space-4);
  border-radius: 20px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-primary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  transition: all 0.2s ease;
}

.chip-btn:hover {
  background: var(--color-primary-light);
  border-color: var(--color-primary);
  color: var(--color-primary);
}
</style>
