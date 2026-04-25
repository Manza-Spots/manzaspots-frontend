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
      <div class="category-badge">{{ spot.category }}</div>
    </div>

    <div class="card-content">
      <div class="card-header">
        <h3 class="spot-title">{{ spot.name }}</h3>
        <span class="spot-distance">
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
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
  border: 1px solid var(--color-border);
  margin-bottom: var(--space-4);
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
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
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
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
  line-height: 1.2;
}

.spot-distance {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--text-xs);
  color: var(--color-primary);
  font-weight: var(--font-semibold);
  background: var(--color-primary-light, rgba(0, 122, 255, 0.1));
  padding: 4px 8px;
  border-radius: 12px;
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
