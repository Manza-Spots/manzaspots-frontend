<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '@/shared/components/Icon.vue'

const props = defineProps({
  spot: {
    type: Object,
    required: true
  }
})

const { t } = useI18n()

// Solo en "mis spots": los no aprobados muestran su estado de revisión.
const review = computed(() => {
  if (props.spot.isApproved !== false) return null
  return props.spot.rejectReason
    ? { label: t('spots.status.rejected'), tone: 'rejected' }
    : { label: t('spots.status.pending'), tone: 'pending' }
})
</script>

<template>
  <div class="spot-card">
    <div class="card-image-wrapper">
      <img :src="spot.imageUrl" :alt="spot.name" loading="lazy" />
    </div>

    <div class="card-content">
      <div class="card-header">
        <h3 class="spot-title">{{ spot.name }}</h3>
        <span v-if="review" class="spot-review" :class="`spot-review--${review.tone}`">
          {{ review.label }}
        </span>
        <span v-else-if="spot.distance" class="spot-distance">
          <Icon name="MapPin" :size="14" class="distance-icon" />
          {{ spot.distance }}
        </span>
      </div>
      <p class="spot-description">{{ spot.description }}</p>
      <p v-if="review?.tone === 'rejected'" class="spot-reject">
        <Icon name="AlertCircle" :size="12" />
        {{ spot.rejectReason }}
      </p>
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
  transition: box-shadow 0.2s;
  cursor: pointer;
  border: 1px solid var(--color-border);
  margin-bottom: var(--space-3);
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

.card-content {
  padding: var(--space-3);
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.card-header {
  display: flex;
  gap: var(--space-2);
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

.spot-review {
  flex: none;
  font-size: 11px;
  font-weight: var(--font-bold);
  padding: 3px 8px;
  border-radius: var(--radius-full);
  white-space: nowrap;
}

.spot-review--pending {
  background: var(--color-arena);
  color: #fff;
}

.spot-review--rejected {
  background: var(--color-coral-tint);
  color: var(--color-coral);
}

.spot-reject {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  margin: var(--space-1) 0 0;
  font-size: var(--text-xs);
  color: var(--color-coral);
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
