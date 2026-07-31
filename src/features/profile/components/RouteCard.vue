<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '@/shared/components/Icon.vue'
import { resolveMediaUrl } from '@/features/spots/utils/spotMapper'

const props = defineProps({
  route: {
    type: Object,
    required: true,
  },
})

const { t } = useI18n()

const photo = computed(() => resolveMediaUrl(props.route.route_photos?.[0]?.img_path))
const title = computed(() => props.route.description || t('profile.routeUnnamed'))
</script>

<template>
  <div class="route-card">
    <div class="route-thumb">
      <img v-if="photo" :src="photo" :alt="title" loading="lazy" />
      <div v-else class="route-thumb--empty">
        <Icon name="Route" :size="22" />
      </div>
    </div>

    <div class="route-body">
      <p class="route-title">{{ title }}</p>
      <div class="route-badges">
        <span v-if="route.difficulty_name" class="route-badge">
          <Icon name="Mountain" :size="12" />
          {{ route.difficulty_name }}
        </span>
        <span v-if="route.travel_mode_name" class="route-badge">
          <Icon name="Footprints" :size="12" />
          {{ route.travel_mode_name }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.route-card {
  display: flex;
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border);
  margin-bottom: var(--space-3);
}

.route-thumb {
  width: 96px;
  flex-shrink: 0;
}

.route-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.route-thumb--empty {
  width: 100%;
  height: 100%;
  min-height: 84px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface-2);
  color: var(--color-text-tertiary);
}

.route-body {
  padding: var(--space-3);
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: var(--space-2);
  min-width: 0;
}

.route-title {
  margin: 0;
  font-size: var(--text-base);
  font-weight: var(--font-extrabold);
  color: var(--color-text-primary);
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.route-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.route-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: var(--font-bold);
  color: var(--color-primary);
  background: var(--color-primary-tint);
  padding: 4px 8px;
  border-radius: var(--radius-full);
}
</style>
