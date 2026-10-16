<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useToast } from '@/shared/composables/useToast'
import { useBottomSheet } from '@/shared/composables/useBottomSheet'
import { profileApi } from '@/features/profile/api/profileApi'
import Icon from '@/shared/components/Icon.vue'
import SegmentedControl from '@/shared/components/SegmentedControl.vue'
import SwipeToDelete from '@/shared/components/SwipeToDelete.vue'
import SpotListCard from '@/features/spots/components/SpotListCard.vue'
import RouteCard from '@/features/spots/components/RouteCard.vue'

const props = defineProps({
  // null => no se muestra el tab de spots (p. ej. "Historial").
  spots: {
    type: Array,
    default: null,
  },
  // null => no se muestra el tab de rutas (p. ej. "Mis spots").
  routes: {
    type: Array,
    default: null,
  },
  // Permite quitar spots y rutas de favoritos deslizando.
  removable: {
    type: Boolean,
    default: false,
  },
})

const { t } = useI18n()
const toast = useToast()
const router = useRouter()
const bottomSheet = useBottomSheet()

// Copias locales para poder quitar filas de forma optimista sin mutar los props.
const localSpots = ref([...(props.spots ?? [])])
const localRoutes = ref([...(props.routes ?? [])])

const hasSpots = computed(() => Array.isArray(props.spots))
const hasRoutes = computed(() => Array.isArray(props.routes))
const hasTabs = computed(() => hasSpots.value && hasRoutes.value)
const tab = ref(hasSpots.value ? 'spots' : 'routes')

const tabOptions = computed(() => [
  { value: 'spots', label: `${t('profile.tabs.spots')} (${localSpots.value.length})` },
  { value: 'routes', label: `${t('profile.tabs.routes')} (${localRoutes.value.length})` },
])

// Los spots en revisión o rechazados aún no tienen página pública.
function openSpot(spot) {
  if (spot.isApproved === false) return
  bottomSheet.close()
  router.push({ name: 'SpotDetail', params: { id: spot.id } })
}

function openRoute(route) {
  bottomSheet.close()
  router.push({ name: 'SpotDetail', params: { id: route.spotId }, query: { route: route.id } })
}

async function removeRoute(route) {
  const index = localRoutes.value.findIndex((r) => r.id === route.id)
  if (index === -1) return

  const [removed] = localRoutes.value.splice(index, 1) // optimista

  try {
    await profileApi.removeFavoriteRoute(route.spotId, route.id)
  } catch (error) {
    localRoutes.value.splice(index, 0, removed)
    toast.error(error.message || t('common.errors.generic'))
  }
}

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
      <SegmentedControl v-model="tab" :options="tabOptions" size="sm" />
    </div>

    <div class="list">
      <template v-if="tab === 'spots'">
        <TransitionGroup name="fav-list" tag="div" @enter="onEnter" @leave="onLeave">
          <div v-for="s in localSpots" :key="s.id" class="fav-item" @click="openSpot(s)">
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
        <TransitionGroup name="fav-list" tag="div" @enter="onEnter" @leave="onLeave">
          <div v-for="r in localRoutes" :key="r.id" class="fav-item" @click="openRoute(r)">
            <SwipeToDelete
              v-if="removable"
              :label="t('profile.edit.swipeDelete')"
              :armed-label="t('profile.edit.swipeRelease')"
              @delete="removeRoute(r)"
            >
              <RouteCard :route="r" />
            </SwipeToDelete>
            <RouteCard v-else :route="r" />
          </div>
        </TransitionGroup>
        <div v-if="!localRoutes.length" class="empty">
          <Icon name="Route" :size="34" />
          <p>{{ removable ? t('profile.emptyRoutes') : t('profile.historyEmpty') }}</p>
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


.fav-item {
  margin-bottom: var(--space-3);
}

/* La tarjeta ya no aporta su propio margen dentro del contenedor. */
.fav-item :deep(.spot-card),
.fav-item :deep(.route-card) {
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
