<script setup>
import Icon from '@/shared/components/Icon.vue'

defineProps({
  spot: {
    type: Object,
    required: true
  }
})
</script>

<template>
  <div class="spot-card">
    <div class="card-image-wrapper">
      <img :src="spot.imageUrl" :alt="spot.name" loading="lazy" />
      <div v-if="spot.category" class="category-badge">{{ spot.category }}</div>
    </div>

    <div class="card-content">
      <div class="card-header">
        <h3 class="spot-title">{{ spot.name }}</h3>
        <span v-if="spot.distance" class="spot-distance">
          <Icon name="MapPin" :size="14" class="distance-icon" />
          {{ spot.distance }}
        </span>
      </div>
      <p class="spot-description">{{ spot.description }}</p>
    </div>
  </div>
</template>

<style scoped>
.spot-card {
  display: flex;
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: transform 0.12s var(--ease-out), box-shadow 0.2s;
  cursor: pointer;
  border: 1px solid var(--color-border);
  margin-bottom: var(--space-3);
}

.spot-card:active {
  transform: scale(0.98);
}

.card-image-wrapper {
  position: relative;
  width: 120px;
  flex-shrink: 0;
}

.card-image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.category-badge {
  position: absolute;
  top: var(--space-2);
  left: var(--space-2);
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  padding: 4px 9px;
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: var(--font-bold);
  backdrop-filter: blur(4px);
}

.card-content {
  padding: var(--space-3);
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-1);
}

.spot-title {
  margin: 0;
  font-size: var(--text-base);
  font-weight: var(--font-extrabold);
  color: var(--color-text-primary);
  line-height: 1.15;
  letter-spacing: -0.01em;
}

.spot-distance {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--text-xs);
  color: var(--color-primary);
  font-weight: var(--font-bold);
  background: var(--color-primary-tint);
  padding: 4px 8px;
  border-radius: var(--radius-full);
  white-space: nowrap;
}

.spot-description {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
