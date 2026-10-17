<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from './Icon.vue'
import { isOnline } from '@/core/network/connectivity'

// Píldora sobre la barra de navegación: "Sin conexión" mientras dure y
// "Conexión recuperada" un momento al volver (las vistas se recargan solas).
defineProps({
  // Variante sobre foto, igual que la barra en el modo inmersivo.
  onPhoto: {
    type: Boolean,
    default: false,
  },
})

const RECONNECTED_MS = 2500

const { t } = useI18n()

// offline · reconnected · null (oculta)
const state = ref(isOnline.value ? null : 'offline')
let timer = null

watch(isOnline, (online) => {
  clearTimeout(timer)
  if (!online) {
    state.value = 'offline'
    return
  }
  if (state.value !== 'offline') return
  state.value = 'reconnected'
  timer = setTimeout(() => {
    state.value = null
  }, RECONNECTED_MS)
})

// Lo anclado al navbar (--nav-anchor) sube lo que ocupa la píldora mientras se
// ve y vuelve a su sitio al ocultarse, sin dejar el hueco vacío.
const pillRef = ref(null)
const PILL_GAP = 12 // var(--space-3), separación entre la píldora y el navbar

const setOffset = (px) =>
  document.documentElement.style.setProperty('--nav-notice-offset', `${px}px`)

const updateOffset = () =>
  setOffset(state.value && pillRef.value ? pillRef.value.offsetHeight + PILL_GAP : 0)

watch(state, updateOffset, { flush: 'post' })
onMounted(updateOffset)

onUnmounted(() => {
  clearTimeout(timer)
  setOffset(0)
})
</script>

<template>
  <div class="connection-slot">
    <Transition name="connection" mode="out-in">
      <div
        v-if="state"
        ref="pillRef"
        :key="state"
        class="connection-pill"
        :class="[`is-${state}`, { 'is-on-photo': onPhoto }]"
        role="status"
      >
        <span class="connection-pill__content">
          <Icon :name="state === 'offline' ? 'WifiOff' : 'Wifi'" :size="14" :stroke-width="2.5" />
          {{ state === 'offline' ? t('common.network.offline') : t('common.network.reconnected') }}
        </span>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.connection-slot {
  position: absolute;
  left: 0;
  right: 0;
  bottom: calc(100% + var(--space-3));
  display: flex;
  justify-content: center;
  pointer-events: none;
}

/* Mismo vidrio que la barra de navegación. */
.connection-pill {
  padding: 6px 12px;
  border-radius: var(--radius-full);
  background: var(--glass-bg);
  -webkit-backdrop-filter: var(--blur);
  backdrop-filter: var(--blur);
  border: 1px solid var(--hairline);
  box-shadow: var(--shadow-md);
  color: var(--color-text-primary);
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
}

.connection-pill.is-on-photo {
  background: var(--on-photo-bg);
  -webkit-backdrop-filter: var(--on-photo-blur);
  backdrop-filter: var(--on-photo-blur);
  border-color: var(--on-photo-border);
  box-shadow: var(--on-photo-shadow);
  color: var(--on-photo-text);
}

.connection-pill__content {
  display: flex;
  align-items: center;
  gap: 6px;
}

.is-offline :deep(svg) {
  color: var(--color-coral);
}

.is-reconnected :deep(svg) {
  color: var(--color-primary);
}

.connection-enter-active,
.connection-leave-active {
  transition:
    opacity var(--transition-base),
    transform var(--transition-base);
}

.connection-enter-from,
.connection-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

/* El pop va en el contenido, como en el resto de los componentes. */
.connection-enter-active .connection-pill__content {
  animation: pop-bounce var(--bounce-pop) var(--ease-spring);
}
</style>
