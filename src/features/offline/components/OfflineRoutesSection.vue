<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Icon from '@/shared/components/Icon.vue'
import RouteCard from '@/features/spots/components/RouteCard.vue'
import ProfileListSheet from '@/features/profile/components/ProfileListSheet.vue'
import { mapRoute } from '@/features/spots/utils/spotMapper'
import { useBottomSheet } from '@/shared/composables/useBottomSheet'
import { formatBytes } from '@/features/offline/composables/useRouteDownload'
import { listOfflineRoutes, deleteOfflineRoute } from '@/features/offline/services/offlineRoutes'

// Misma forma que "Historial" en el perfil: las más recientes y el resto en el
// sheet, donde se borran deslizando.
defineProps({
  // Sin descargas no se muestra nada (p. ej. en la bienvenida sin sesión).
  hideWhenEmpty: {
    type: Boolean,
    default: false,
  },
})

const PREVIEW = 3

const router = useRouter()
const { t } = useI18n()
const bottomSheet = useBottomSheet()

const routes = ref([])
const loaded = ref(false)

// Sin fotos (sin señal no cargarían); sin nombre, el del spot.
const toCard = (record) => ({
  ...mapRoute(record.route),
  spotId: record.spotId,
  description: record.route.description || record.spot.name,
  photos: [],
  offlineSize: formatBytes(record.bytes),
})

async function load() {
  routes.value = (await listOfflineRoutes()).map(toCard)
  loaded.value = true
}

// Se abre directo en Seguir: el detalle del spot necesita la API.
const open = (route) =>
  router.push({ name: 'FollowRoute', query: { spot: route.spotId, route: route.id } })

async function remove(route) {
  await deleteOfflineRoute(route.spotId, route.id)
  routes.value = routes.value.filter((r) => r !== route)
}

const openAll = () => {
  if (!routes.value.length) return
  bottomSheet.open(
    ProfileListSheet,
    {
      routes: routes.value,
      removable: true,
      onOpenRoute: open,
      onRemoveRoute: remove,
      emptyRoutesText: t('offline.empty'),
    },
    { title: t('offline.title'), closable: true }
  )
}

onMounted(load)
</script>

<template>
  <section v-if="loaded && (routes.length || !hideWhenEmpty)" class="offline-section">
    <div class="section-head">
      <span class="section-label">{{ t('offline.title') }}</span>
      <button v-if="routes.length" class="section-count" @click="openAll">
        {{ routes.length }}
        <Icon name="ChevronRight" :size="14" />
      </button>
    </div>

    <template v-if="routes.length">
      <RouteCard
        v-for="r in routes.slice(0, PREVIEW)"
        :key="r.id"
        :route="r"
        class="offline-card"
        @click="open(r)"
      />
    </template>
    <div v-else class="offline-empty">
      <Icon name="WifiOff" :size="18" />
      <span>{{ t('offline.empty') }}</span>
    </div>
  </section>
</template>

<style scoped>
/* Misma cabecera, tarjetas y vacío que las secciones del perfil. */
.offline-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: 100%;
  text-align: left;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-label {
  font-size: 11px;
  font-weight: var(--font-extrabold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-tertiary);
}

.section-count {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
  color: var(--color-text-secondary);
}

.offline-card {
  margin-bottom: 0;
  cursor: pointer;
}

.offline-empty {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-height: 60px;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-xl);
  border: 1px dashed var(--color-border-hover);
  background: var(--color-surface-2);
  color: var(--color-text-tertiary);
  font-size: var(--text-sm);
}
</style>
