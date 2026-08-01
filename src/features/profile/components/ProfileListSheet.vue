<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from '@/shared/composables/useToast'
import { profileApi } from '@/features/profile/api/profileApi'
import Icon from '@/shared/components/Icon.vue'
import SwipeToDelete from '@/shared/components/SwipeToDelete.vue'
import SpotListCard from '@/features/spots/components/SpotListCard.vue'
import RouteCard from './RouteCard.vue'

const props = defineProps({
  spots: {
    type: Array,
    default: () => [],
  },
  // null => no se muestra el tab de rutas (p. ej. "Mis spots").
  routes: {
    type: Array,
    default: null,
  },
  // Muestra el botón para quitar spots de favoritos.
  removable: {
    type: Boolean,
    default: false,
  },
})

const { t } = useI18n()
const toast = useToast()

// Copia local para poder quitar filas de forma optimista sin mutar los props.
const localSpots = ref([...props.spots])

const hasTabs = computed(() => Array.isArray(props.routes))
const tab = ref('spots')

async function removeSpot(spot) {
  const index = localSpots.value.findIndex((s) => s.id === spot.id)
  if (index === -1) return

  const [removed] = localSpots.value.splice(index, 1) // optimista

  try {
    // El item desapareciendo con su animación ya es feedback suficiente;
    // no mostramos toast de éxito.
    await profileApi.removeFavoriteSpot(spot.id)
  } catch (error) {
    // Revierte si falla.
    localSpots.value.splice(index, 0, removed)
    toast.error(error.message || t('common.errors.generic'))
  }
}

// ─── Animación de colapso al agregar/quitar filas ──────────────────────────────
// Animamos la altura del item que entra/sale; la altura del sheet (contenido
// auto) sigue ese cambio frame a frame, dando un ajuste suave.
function onLeave(el, done) {
  const height = el.offsetHeight
  el.style.height = `${height}px`
  el.style.overflow = 'hidden'
  void el.offsetHeight // fuerza reflow para fijar la altura inicial
  requestAnimationFrame(() => {
    el.style.height = '0px'
    el.style.marginBottom = '0px'
    el.style.opacity = '0'
  })
  const onEnd = (e) => {
    if (e.target === el && e.propertyName === 'height') {
      el.removeEventListener('transitionend', onEnd)
      done()
    }
  }
  el.addEventListener('transitionend', onEnd)
}

function onEnter(el, done) {
  const height = el.offsetHeight
  el.style.height = '0px'
  el.style.overflow = 'hidden'
  el.style.opacity = '0'
  void el.offsetHeight
  requestAnimationFrame(() => {
    el.style.height = `${height}px`
    el.style.opacity = '1'
  })
  const onEnd = (e) => {
    if (e.target === el && e.propertyName === 'height') {
      el.removeEventListener('transitionend', onEnd)
      el.style.height = ''
      el.style.overflow = ''
      done()
    }
  }
  el.addEventListener('transitionend', onEnd)
}
</script>

<template>
  <div class="list-sheet">
    <div v-if="hasTabs" class="list-header">
      <div class="tabs">
        <button class="tab" :class="{ active: tab === 'spots' }" @click="tab = 'spots'">
          {{ t('profile.tabs.spots') }} ({{ localSpots.length }})
        </button>
        <button class="tab" :class="{ active: tab === 'routes' }" @click="tab = 'routes'">
          {{ t('profile.tabs.routes') }} ({{ routes.length }})
        </button>
      </div>
    </div>

    <div class="list">
      <template v-if="!hasTabs || tab === 'spots'">
        <TransitionGroup name="fav-list" tag="div" @enter="onEnter" @leave="onLeave">
          <div v-for="s in localSpots" :key="s.id" class="fav-item">
            <SwipeToDelete
              v-if="removable"
              :label="t('profile.edit.swipeDelete')"
              :armed-label="t('profile.edit.swipeRelease')"
              @delete="removeSpot(s)"
            >
              <SpotListCard :spot="s" />
            </SwipeToDelete>
            <SpotListCard v-else :spot="s" />
          </div>
        </TransitionGroup>
        <div v-if="!localSpots.length" class="empty">
          <Icon name="MapPinned" :size="34" />
          <p>{{ t('profile.emptySpots') }}</p>
        </div>
      </template>

      <template v-else>
        <RouteCard v-for="r in routes" :key="r.id" :route="r" />
        <div v-if="!routes.length" class="empty">
          <Icon name="Route" :size="34" />
          <p>{{ t('profile.emptyRoutes') }}</p>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.list-sheet {
  /* Un único contenedor scrolleable: el body del bottom sheet. Sin scroll
     interno para no anidar dos áreas de scroll (evita conflictos de gesto). */
  position: relative;
}

/* Cabecera pegajosa: los tabs quedan visibles mientras la lista scrollea. */
.list-header {
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--color-bg);
  padding-bottom: var(--space-3);
}

.tabs {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: var(--color-surface-2);
  border-radius: var(--radius-full);
}

.tab {
  flex: 1;
  padding: 9px 12px;
  border: none;
  background: transparent;
  border-radius: var(--radius-full);
  font-size: 13.5px;
  font-weight: var(--font-bold);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.tab.active {
  background: var(--color-surface);
  color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}


.fav-item {
  margin-bottom: var(--space-3);
}

/* La tarjeta ya no aporta su propio margen dentro del contenedor. */
.fav-item :deep(.spot-card) {
  margin-bottom: 0;
}

/* Transición de altura al entrar/salir una fila (colapso suave). */
.fav-list-leave-active {
  transition: height 0.28s ease, margin 0.28s ease, opacity 0.28s ease;
}

.fav-list-enter-active {
  transition: height 0.28s ease, opacity 0.28s ease;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-8) 0;
  color: var(--color-text-tertiary);
  text-align: center;
}

.empty p {
  margin: 0;
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
}
</style>
