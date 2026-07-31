<script setup>
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '@/shared/components/Icon.vue'
import { parseKm } from '../utils/spotFilters'
import { useKeyboard } from '@/shared/composables/useKeyboard'

const props = defineProps({
  spots: {
    type: Array,
    required: true,
  },
})

const { t } = useI18n()
const { keyboardHeight } = useKeyboard()

// Al abrir el teclado, el contenido (pager) sube por encima de él para no dejar
// la info del spot tapada; el contenedor sigue a pantalla completa, así su fondo
// oscuro rellena el hueco de abajo (en vez de dejar ver el mapa).
const listStyle = computed(() =>
  keyboardHeight.value > 0 ? { bottom: `calc(${keyboardHeight.value}px + 96px)` } : {},
)

const pagerRef = ref(null)
const activeIndex = ref(0)

const onScroll = () => {
  const el = pagerRef.value
  if (!el || el.clientHeight === 0) return
  activeIndex.value = Math.min(
    props.spots.length - 1,
    Math.max(0, Math.round(el.scrollTop / el.clientHeight)),
  )
}

watch(
  () => props.spots,
  () => {
    activeIndex.value = 0
    pagerRef.value?.scrollTo({ top: 0 })
  },
)
const visibleDots = computed(() => {
  const total = props.spots.length
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i)
  }

  if (activeIndex.value <= 2) {
    return [0, 1, 2, 3, 4]
  }

  if (activeIndex.value >= total - 3) {
    return [total - 5, total - 4, total - 3, total - 2, total - 1]
  }

  return [
    activeIndex.value - 2,
    activeIndex.value - 1,
    activeIndex.value,
    activeIndex.value + 1,
    activeIndex.value + 2
  ]
})

const formatKm = (distance) => {
  const km = parseKm(distance)
  return km % 1 === 0 ? String(km) : km.toFixed(1)
}
</script>

<template>
  <div class="immersive-list">
    <div ref="pagerRef" class="immersive-pager" :style="listStyle" @scroll.passive="onScroll">
      <section
        v-for="spot in spots"
        :key="spot.id"
        class="immersive-slide"
      >
        <img
          class="slide-photo"
          :src="spot.imageUrl"
          :alt="spot.name"
          loading="lazy"
          draggable="false"
        />
        <div class="scrim-top"></div>
        <div class="scrim-bottom"></div>

        <div class="slide-info">
          <div v-if="spot.distance" class="slide-km">
            {{ formatKm(spot.distance) }}<small> km</small>
          </div>
          <h2 class="slide-name">{{ spot.name }}</h2>
          <p class="slide-meta">
            <Icon name="MapPin" :size="15" />
            {{ spot.description }}
          </p>
        </div>
      </section>

      <div v-if="!spots.length" class="immersive-empty">
        <Icon name="MapPinned" :size="40" />
        <p>{{ t('spots.immersive.empty') }}</p>
      </div>
    </div>

    <div v-if="spots.length > 1" class="pager-dots">
      <span
        v-for="dotIndex in visibleDots"
        :key="`dot-${dotIndex}`"
        class="pager-dot"
        :class="{
          'is-on': dotIndex === activeIndex,
          'is-small': (dotIndex === visibleDots[0] && dotIndex !== 0) || (dotIndex === visibleDots[visibleDots.length - 1] && dotIndex !== spots.length - 1)
        }"
      ></span>
    </div>
  </div>
</template>

<style scoped>
.immersive-list {
  position: absolute;
  inset: 0;
  background: var(--color-gray-900);
  overflow: hidden;
}

.immersive-pager {
  position: absolute;
  inset: 0;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  -ms-overflow-style: none;
  scrollbar-width: none;
  transition: bottom 0.28s ease;
}

.immersive-pager::-webkit-scrollbar {
  display: none;
}

.immersive-slide {
  position: relative;
  height: 100%;
  scroll-snap-align: start;
  scroll-snap-stop: always;
  overflow: hidden;
}

.slide-photo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  user-select: none;
}

.scrim-top {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 34%;
  z-index: 2;
  background: linear-gradient(to bottom, rgba(20, 25, 22, 0.5), transparent);
}

.scrim-bottom {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 62%;
  z-index: 2;
  background: linear-gradient(
    to top,
    rgba(20, 25, 22, 0.86) 0%,
    rgba(20, 25, 22, 0.35) 45%,
    transparent 100%
  );
}

.slide-info {
  position: absolute;
  left: var(--space-5);
  right: 56px;
  bottom: calc(76px + var(--safe-area-inset-bottom));
  z-index: 6;
  color: var(--color-text-inverse);
}

.slide-cat {
  margin-bottom: 14px;
}

.glass-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: var(--font-bold);
  color: #fff;
  background: rgba(255, 255, 255, 0.18);
  -webkit-backdrop-filter: saturate(160%) blur(8px);
  backdrop-filter: saturate(160%) blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.28);
  padding: 5px 10px;
  border-radius: var(--radius-full);
}

.slide-km {
  font-size: 46px;
  font-weight: var(--font-extrabold);
  letter-spacing: -0.035em;
  line-height: 0.95;
  text-shadow: 0 2px 18px rgba(0, 0, 0, 0.35);
}

.slide-km small {
  font-size: 19px;
  font-weight: var(--font-bold);
  opacity: 0.9;
  letter-spacing: -0.01em;
}

.slide-name {
  font-size: 25px;
  font-weight: var(--font-extrabold);
  color: var(--color-text-inverse);
  letter-spacing: -0.025em;
  line-height: 1.05;
  margin: 8px 0 0;
  text-shadow: 0 2px 14px rgba(0, 0, 0, 0.4);
}

.slide-meta {
  font-size: 13.5px;
  font-weight: var(--font-semibold);
  opacity: 0.85;
  margin: 8px 0 0;
  display: flex;
  align-items: flex-start;
  gap: 6px;
}

.slide-meta svg {
  flex-shrink: 0;
  margin-top: 2px;
}

.pager-dots {
  position: absolute;
  right: 14px;
  bottom: calc(150px + var(--safe-area-inset-bottom));
  z-index: 6;
  display: flex;
  flex-direction: column;
  gap: 7px;
  align-items: center;
  pointer-events: none;
}

.pager-dot {
  width: 6px;
  height: 6px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.5);
  transition: all 0.3s var(--ease-out);
}

.pager-dot.is-on {
  background: #fff;
  height: 20px;
}

.pager-dot.is-small {
  transform: scale(0.65);
  opacity: 0.35;
}

.swipe-hint {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: calc(80px + var(--safe-area-inset-bottom));
  z-index: 6;
  font-size: 11px;
  font-weight: var(--font-bold);
  color: rgba(255, 255, 255, 0.85);
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
  gap: 5px;
  pointer-events: none;
}

.immersive-empty {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  color: rgba(255, 255, 255, 0.7);
}

.immersive-empty p {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  margin: 0;
}

/* Dark mode */
:global(html.dark) .immersive-list {
  background: var(--color-bg);
}

:global(html.dark) .scrim-top {
  background: linear-gradient(to bottom, rgba(12, 16, 14, 0.55), transparent);
}

:global(html.dark) .scrim-bottom {
  background: linear-gradient(
    to top,
    rgba(12, 16, 14, 0.90) 0%,
    rgba(12, 16, 14, 0.40) 45%,
    transparent 100%
  );
}

:global(html.dark) .immersive-empty {
  color: var(--color-text-secondary);
}
</style>
