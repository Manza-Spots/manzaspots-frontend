<script setup>
import { computed } from 'vue'
import Icon from './Icon.vue'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    required: true,
  },
  /** Opciones: { value, label?, icon?, ariaLabel? } — label e icon son opcionales. */
  options: {
    type: Array,
    required: true,
  },
  /**
   * glass    → barra translúcida para overlays sobre el mapa
   * surface  → barra sólida para sheets y contenido
   * on-photo → vidrio claro sobre foto/modo inmersivo
   */
  variant: {
    type: String,
    default: 'surface',
    validator: (v) => ['glass', 'surface', 'on-photo'].includes(v),
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md'].includes(v),
  },
})

const emit = defineEmits(['update:modelValue'])

const activeIndex = computed(() =>
  props.options.findIndex((o) => o.value === props.modelValue),
)

// El thumb mide 1/N del ancho útil y se desplaza por múltiplos de sí mismo.
const thumbStyle = computed(() => ({
  '--seg-count': props.options.length,
  transform: `translateX(${activeIndex.value * 100}%)`,
  opacity: activeIndex.value === -1 ? 0 : 1,
}))

const select = (value) => {
  if (value !== props.modelValue) emit('update:modelValue', value)
}
</script>

<template>
  <div class="seg" :class="[`seg--${variant}`, `seg--${size}`]" role="tablist">
    <!-- El riel recorta el thumb: el rebote sobrepasa su destino, pero
         siempre dentro de la caja. -->
    <div class="seg-track">
      <div class="seg-thumb" :style="thumbStyle"></div>
    </div>

    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      role="tab"
      class="seg-btn"
      :class="{ 'is-active': option.value === modelValue }"
      :aria-selected="option.value === modelValue"
      :aria-label="option.ariaLabel || option.label"
      @click="select(option.value)"
    >
      <span class="seg-btn__content">
        <Icon v-if="option.icon" :name="option.icon" :size="size === 'sm' ? 16 : 18" />
        <span v-if="option.label">{{ option.label }}</span>
      </span>
    </button>
  </div>
</template>

<style scoped>
.seg {
  position: relative;
  display: flex;
  padding: 4px;
  border-radius: var(--radius-full);
}

.seg-track {
  position: absolute;
  inset: 4px;
  border-radius: var(--radius-full);
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.seg-thumb {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: calc(100% / var(--seg-count, 2));
  border-radius: var(--radius-full);
  transition: transform var(--bounce-slide) var(--ease-spring), opacity var(--transition-fast);
}

.seg-btn {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: var(--radius-full);
  font-weight: var(--font-bold);
  cursor: pointer;
  white-space: nowrap;
  transition: color var(--transition-slow);
  -webkit-tap-highlight-color: transparent;
}

.seg-btn:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.seg-btn__content {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

/* Mismo rebote del BottomNav al activarse (keyframe global en main.css).
   Se aplica al contenido completo para que también rebote cuando el
   segmento es solo texto (p. ej. los tabs Spots/Rutas). */
.seg-btn.is-active .seg-btn__content {
  animation: pop-bounce var(--bounce-pop) var(--ease-spring) forwards;
}

/* Tamaños */
.seg--md .seg-btn {
  padding: 8px 16px;
  font-size: 15px;
}

.seg--sm .seg-btn {
  padding: 9px 12px;
  font-size: var(--text-sm);
}

/* Variante: vidrio sobre mapa */
.seg--glass {
  background: var(--glass-bg);
  -webkit-backdrop-filter: var(--blur);
  backdrop-filter: var(--blur);
  border: 1px solid var(--hairline);
  box-shadow: var(--shadow-md);
}

.seg--glass .seg-thumb {
  background: var(--color-primary-tint);
}

.seg--glass .seg-btn {
  color: var(--color-text-secondary);
}

.seg--glass .seg-btn.is-active {
  color: var(--color-primary);
}

/* Variante: superficie (sheets y contenido) */
.seg--surface {
  background: var(--color-surface-2);
}

.seg--surface .seg-thumb {
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.seg--surface .seg-btn {
  color: var(--color-text-secondary);
}

.seg--surface .seg-btn.is-active {
  color: var(--color-primary);
}

/* Variante: sobre foto (modo inmersivo) */
.seg--on-photo {
  background: rgba(255, 255, 255, 0.16);
  -webkit-backdrop-filter: saturate(160%) blur(14px);
  backdrop-filter: saturate(160%) blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.28);
}

.seg--on-photo .seg-thumb {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: var(--shadow-sm);
}

.seg--on-photo .seg-btn {
  color: rgba(255, 255, 255, 0.92);
}

.seg--on-photo .seg-btn.is-active {
  color: var(--color-selva-deep);
}
</style>
