<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '@/shared/components/Icon.vue'

const props = defineProps({
  photos: {
    type: Array,
    default: () => [],
  },

  max: {
    type: Number,
    default: 6,
  },
})

const { t } = useI18n()

const visible = computed(() => props.photos.slice(0, props.max))
const overflow = computed(() => Math.max(0, props.photos.length - props.max))
</script>

<template>
  <section v-if="photos.length" class="gallery">
    <header class="gallery-head">
      <span class="gallery-title">{{ t('spots.detail.gallery') }}</span>
      <span class="gallery-count">{{ photos.length }}</span>
    </header>

    <div class="gallery-strip">
      <figure
        v-for="(photo, index) in visible"
        :key="photo.id"
        class="gallery-item"
      >
        <img :src="photo.url" :alt="photo.description || t('spots.detail.gallery')" loading="lazy" />
        <span v-if="overflow && index === visible.length - 1" class="gallery-more">
          +{{ overflow }}
        </span>
      </figure>
    </div>
  </section>

  <section v-else class="gallery-empty">
    <Icon name="Camera" :size="26" />
    <p>{{ t('spots.detail.galleryEmpty') }}</p>
  </section>
</template>

<style scoped>
.gallery {
  margin-top: var(--space-6);
}

.gallery-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: var(--space-3);
}

.gallery-title {
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-tertiary);
}

.gallery-count {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--color-text-tertiary);
}

.gallery-strip {
  display: flex;
  gap: var(--space-2);
  overflow-x: auto;
  scroll-snap-type: x proximity;
  -ms-overflow-style: none;
  scrollbar-width: none;

  margin: 0 calc(-1 * var(--space-5));
  padding: 0 var(--space-5);
}

.gallery-strip::-webkit-scrollbar {
  display: none;
}

.gallery-item {
  position: relative;
  flex: none;

  width: 116px;
  aspect-ratio: 9 / 16;
  margin: 0;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--color-surface-2);
  scroll-snap-align: start;
}

.gallery-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.gallery-more {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(20, 25, 22, 0.55);
  color: var(--color-text-inverse);
  font-size: var(--text-base);
  font-weight: var(--font-bold);
}

.gallery-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-6);
  padding: var(--space-6) 0;
  border-radius: var(--radius-xl);
  background: var(--color-surface-2);
  color: var(--color-text-tertiary);
  text-align: center;
}

.gallery-empty p {
  margin: 0;
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
}
</style>
