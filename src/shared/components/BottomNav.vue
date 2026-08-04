<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Icon from './Icon.vue'
import { useAppReady } from '@/shared/composables/useAppReady'
import { useBottomSheet } from '@/shared/composables/useBottomSheet'
import { useImmersiveMode } from '@/shared/composables/useImmersiveMode'
import { useSpotsSearch } from '@/features/spots/composables/useSpotsSearch'
import { useKeyboard } from '@/shared/composables/useKeyboard'
import SettingsMenu from '@/features/settings/components/SettingsMenu.vue'

const { t } = useI18n()
const { query: spotsSearchQuery } = useSpotsSearch()
const { keyboardHeight } = useKeyboard()

const router = useRouter()
const route = useRoute()
const { isAppReady } = useAppReady()
const bottomSheet = useBottomSheet()
const { isImmersive } = useImmersiveMode()

const isSearching = ref(false)
const searchQuery = ref('')
const searchInput = ref(null)

const isClicking = ref(false)
const isActionClicking = ref(false)
const isNavVisible = ref(false)

watch(isAppReady, (ready) => {
  if (ready) {
    requestAnimationFrame(() => {
      isNavVisible.value = true
    })
  }
}, { immediate: true })

watch(isSearching, (val) => {
  if (!val) {
    searchQuery.value = ''
  }
})

// El input de búsqueda vive aquí (global), pero solo aplica a la vista de Spots.
// Sincroniza el término al estado compartido para filtrar mapa + lista.
watch(searchQuery, (val) => {
  if (route.path === '/spots') spotsSearchQuery.value = val
})

// La búsqueda pertenece a Spots: si se sale de ahí (botón atrás de Android,
// redirección), el buscador no debe quedarse abierto sobre otra vista.
watch(() => route.path, () => {
  if (isSearching.value) isSearching.value = false
})

const clickStartTime = ref(0)
let clickTimeout = null

const actionClickStartTime = ref(0)
let actionClickTimeout = null

const navItems = [
  {
    name: 'Spots',
    path: '/spots',
    icon: 'MapPin',
    labelKey: 'navigation.spots',
  },
  {
    name: 'RecordRoute',
    path: '/record-route',
    icon: 'Radio',
    labelKey: 'navigation.record',
  },
  {
    name: 'Profile',
    path: '/profile',
    icon: 'User',
    labelKey: 'navigation.profile',
  },
]

const navigateTo = (path) => {
  router.push(path)
}

const activeIndex = computed(() => navItems.findIndex((i) => i.path === route.path))
const activeItem = computed(() => navItems[activeIndex.value])

const sliderStyle = computed(() => ({
  width: `${100 / navItems.length}%`,
  transform: `translateX(${activeIndex.value * 100}%)`,
  opacity: activeIndex.value === -1 ? 0 : 1,
}))

// Solo feedback táctil: la navegación va en el @click de cada item.
const startNavPress = () => {
  if (isSearching.value) return
  isClicking.value = true
  clickStartTime.value = Date.now()
}

const endNavPress = () => {
  if (isSearching.value) return

  const elapsed = Date.now() - clickStartTime.value
  if (elapsed < 200) {
    clearTimeout(clickTimeout)
    clickTimeout = setTimeout(() => {
      isClicking.value = false
    }, 200 - elapsed)
  } else {
    isClicking.value = false
  }
}

const startActionClick = () => {
  isActionClicking.value = true
  actionClickStartTime.value = Date.now()
}

const endActionClick = () => {
  const elapsed = Date.now() - actionClickStartTime.value
  if (elapsed < 200) {
    clearTimeout(actionClickTimeout)
    actionClickTimeout = setTimeout(() => {
      isActionClicking.value = false
    }, 200 - elapsed)
  } else {
    isActionClicking.value = false
  }
}

const floatingButton = computed(() => {
  const buttonConfig = {
    '/spots': {
      icon: 'Search',
      action: 'search',
      show: true,
    },
    '/record-route': {
      icon: 'Plus',
      action: 'record',
      show: true,
    },
    '/profile': {
      icon: 'Settings',
      action: 'settings',
      show: true,
    },
  }

  return buttonConfig[route.path] || { show: false }
})


const openSearch = () => {
  isSearching.value = true
}


const closeSearch = () => {
  isSearching.value = false
}

const openSettings = () => {
  bottomSheet.open(SettingsMenu,
    {
      title: computed(() => t('settings.title', 'Configuraciones')),
      closable: true,
      closeOnBackdrop: true
    }
  )
}

const handleBlur = () => {
  setTimeout(() => {
    if (!searchQuery.value && document.activeElement !== searchInput.value) {
      closeSearch()
    }
  }, 200)
}

const clearSearch = () => {
  searchQuery.value = ''
  searchInput.value?.focus()
}

const handleFloatingAction = () => {
  if (floatingButton.value.action === 'search') {
    openSearch()
  }else if(floatingButton.value.action === 'settings') {
    openSettings()
  }
}
</script>

<template>
<nav
  class="bottom-nav"
  :class="{ 'bottom-nav--gradient': keyboardHeight === 0 }"
  @touchstart.passive="() => {}"
  :style="{ transform: `translateY(-${keyboardHeight}px)` }"
>
    <div class="nav-layout" :class="{ 'is-visible': isNavVisible, 'is-immersive': isImmersive }">
      <div
        class="nav-pill"
        :class="{ 'is-compact': isSearching, 'is-zoomed': isClicking }"
        @click="isSearching && closeSearch()"
      >
        <div class="nav-pill-content" :class="{ 'is-hidden': isSearching }">
          <div
            class="nav-items-wrapper"
            @touchstart.passive="startNavPress"
            @touchend.passive="endNavPress"
            @touchcancel.passive="endNavPress"
          >
            <!-- El riel recorta el slider con la misma forma que él: el rebote
                 sobrepasa su destino sin salirse del pill. -->
            <div class="nav-slider-track">
              <div class="nav-slider" :style="sliderStyle">
                <div class="nav-slider-inner"></div>
              </div>
            </div>
            <button
              v-for="item in navItems"
              :key="item.path"
              class="nav-item"
              :class="{ 'nav-item--active': route.path === item.path }"
              @click.stop="!isSearching && navigateTo(item.path)"
            >
              <span class="nav-item__content">
                <Icon :name="item.icon" :size="24" class="nav-item__icon" />
                <span class="nav-item__label">{{ $t(item.labelKey) }}</span>
              </span>
            </button>
          </div>
        </div>
        <div class="nav-pill-compact" :class="{ 'is-visible': isSearching }">
          <Icon
            :name="activeItem ? activeItem.icon : 'GalleryVerticalEnd'"
            :size="24"
            class="nav-item__icon nav-item--active"
            :style="isImmersive ? 'color: var(--color-text-inverse)' : 'color: var(--color-primary)'"
          />
        </div>
      </div>

      <div
        v-if="floatingButton.show"
        class="action-pill"
        :class="{ 'is-expanded': isSearching, 'is-zoomed': isActionClicking }"
        @click="!isSearching && handleFloatingAction()"
        @touchstart="!isSearching && startActionClick()"
        @touchend="endActionClick"
        @touchcancel="endActionClick"
      >
        <Icon
          :name="isSearching ? 'Search' : floatingButton.icon"
          :size="isSearching ? 20 : 24"
          class="pill-icon"
        />
        <div class="search-input-wrapper" :class="{ 'is-visible': isSearching }">
          <input
            ref="searchInput"
            v-model="searchQuery"
            type="text"
            class="search-input"
            :placeholder="$t('common.placeholders.search')"
            @blur="handleBlur"
          />
          <button v-if="searchQuery" class="clear-button" @click.stop="clearSearch">
            <Icon name="X" :size="18" />
          </button>
          <button class="mic-button" @click.stop>
            <Icon name="Mic" :size="20" />
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: var(--space-6);
  padding-top: var(--space-4);
  z-index: 100;
  pointer-events: none;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.25s ease;
}

.nav-layout {
  position: relative;
  width: 100%;
  max-width: 520px;
  margin: 0 auto;
  height: 56px;
  transform: translateY(calc(100% + var(--space-6)));
  opacity: 0;
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1),
              opacity 0.4s ease;
}

.nav-layout.is-visible {
  transform: translateY(0);
  opacity: 1;
}

.nav-pill {
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  background: var(--glass-bg);
  -webkit-backdrop-filter: var(--blur);
  backdrop-filter: var(--blur);
  border-radius: var(--radius-full);
  border: 1px solid var(--hairline);
  box-shadow: var(--shadow-md);
  height: 56px;
  width: calc(100% - 56px - var(--space-2));
  overflow: hidden;
  transform: scale(1);
  transform-origin: center center;
  transition:
    width 0.5s cubic-bezier(0.16, 1, 0.3, 1),
    transform 1s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: clip-path, transform;
  cursor: pointer;
  pointer-events: all;
  z-index: 1;
  touch-action: manipulation;
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
}

.nav-pill:active,
.nav-pill.is-zoomed {
  transform: scale(1.05);
}
.nav-pill.is-compact {
  width: 56px;
}

.nav-pill-content,
.nav-pill-compact {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  transition: opacity 0.3s ease;
  will-change: opacity;
}

.nav-pill-content {
  padding: 3px;
  box-sizing: border-box;
  opacity: 1;
  pointer-events: auto;
}
.nav-pill-content.is-hidden {
  opacity: 0;
  pointer-events: none;
}

.nav-pill-compact {
  width: 56px;
  justify-content: center;
  opacity: 0;
  pointer-events: none;
}
.nav-pill-compact.is-visible {
  opacity: 1;
  pointer-events: auto;
}

.action-pill {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  background: var(--glass-bg);
  -webkit-backdrop-filter: var(--blur);
  backdrop-filter: var(--blur);
  border-radius: var(--radius-full);
  border: 1px solid var(--hairline);
  box-shadow: var(--shadow-md);
  height: 56px;
  width: 56px;
  padding: 0 16px;
  box-sizing: border-box;
  overflow: hidden;
  transform: scale(1);
  transform-origin: center center;
  transition:
    width 0.5s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: width, transform;
  cursor: pointer;
  pointer-events: all;
  z-index: 2;
  touch-action: manipulation;
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
}

.action-pill:not(.is-expanded):active,
.action-pill.is-zoomed:not(.is-expanded) {
  transform: scale(1.2);
}

.action-pill.is-expanded {
  width: calc(100% - 56px - var(--space-2));
  padding: 0 var(--space-3);
  cursor: default;
}

.pill-icon {
  flex-shrink: 0;
  color: var(--color-text-primary);
  transition: color 0.3s ease;
}
.action-pill.is-expanded .pill-icon {
  color: var(--color-text-tertiary);
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex: 1;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  min-width: 0;
  margin-left: var(--space-2);
}
.search-input-wrapper.is-visible {
  opacity: 1;
  pointer-events: auto;
  transition: opacity 0.4s ease 0.1s;
}

.nav-items-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
}

.nav-slider-track {
  position: absolute;
  inset: 0;
  border-radius: var(--radius-full);
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.nav-slider {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    transform var(--bounce-slide) var(--ease-spring),
    opacity 0.3s ease;
  pointer-events: none;
}

.nav-slider-inner {
  height: 100%;
  width: 100%;
  border-radius: var(--radius-full);
  background: var(--color-primary-tint);
}

.nav-item {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  height: 100%;
  border-radius: 100px;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  color: var(--color-text-tertiary);
  flex: 1 0 0px;
  min-width: 72px;
  touch-action: manipulation;
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
}

/* Envoltorio del contenido: el pop y el press se aplican aquí (icono +
   etiqueta juntos), igual que en SegmentedControl. */
.nav-item__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: var(--press-transition);
}

.nav-item__icon {
  transition: color 0.4s ease;
}

.nav-item:active .nav-item__content {
  transform: scale(var(--press-scale));
}

.nav-item__label {
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  transition: color 0.3s ease;
  white-space: nowrap;
  margin-top: 2px;
}

.nav-item.nav-item--active {
  color: var(--color-primary);
}

.nav-item--active .nav-item__icon {
  color: var(--color-primary);
}

.nav-item--active .nav-item__content {
  animation: pop-bounce var(--bounce-pop) var(--ease-spring) forwards;
}

.nav-item--active .nav-item__label {
  color: var(--color-primary);
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: var(--text-base);
  color: var(--color-text-primary);
  outline: none;
  min-width: 0;
}

.search-input::placeholder {
  color: var(--color-text-tertiary);
}

.clear-button,
.mic-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: var(--press-transition);
  flex-shrink: 0;
}

.clear-button:active,
.mic-button:active {
  transform: scale(var(--press-scale-strong));
}

.mic-button {
  color: var(--color-text-tertiary);
}

.is-immersive .nav-pill,
.is-immersive .action-pill {
  background: var(--on-photo-bg);
  -webkit-backdrop-filter: var(--on-photo-blur);
  backdrop-filter: var(--on-photo-blur);
  border-color: var(--on-photo-border);
  box-shadow: var(--on-photo-shadow);
}

.is-immersive .nav-item {
  color: var(--on-photo-text);
}

/* El indicador del elemento activo es el slider, igual que en el control
   segmentado del header. Pintarlo además de fondo sobre el item teñía
   también su icono y su etiqueta, y con un tint que cambia según el tema. */
.is-immersive .nav-item.nav-item--active,
.is-immersive .nav-item--active .nav-item__icon,
.is-immersive .nav-item--active .nav-item__label {
  color: var(--on-photo-text-active);
}

.is-immersive .nav-slider-inner {
  background: var(--on-photo-indicator);
}

.is-immersive .pill-icon {
  color: var(--on-photo-text);
}

.is-immersive .search-input {
  color: #fff;
}

.is-immersive .search-input::placeholder {
  color: rgba(255, 255, 255, 0.55);
}

.is-immersive .clear-button,
.is-immersive .mic-button {
  color: var(--on-photo-text);
}

</style>
