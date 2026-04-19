<script setup>
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

function toggleLocale() {
  locale.value = locale.value === 'es' ? 'en' : 'es'
}
</script>

<template>
  <button
    id="lang-switcher"
    class="lang-switcher"
    @click="toggleLocale"
    :aria-label="$t('common.labels.switchLanguage')"
  >
    <span class="lang-flag">{{ locale === 'es' ? '🇲🇽' : '🇺🇸' }}</span>
    <span class="lang-label">{{ locale === 'es' ? 'ES' : 'EN' }}</span>
  </button>
</template>

<style scoped>
.lang-switcher {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px 6px 8px;
  background: rgba(255, 255, 255, 0.85);
  -webkit-backdrop-filter: saturate(180%) blur(12px);
  backdrop-filter: saturate(180%) blur(12px);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 100px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
              background 0.2s ease;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

.lang-switcher:active {
  transform: scale(0.92);
}

.lang-flag {
  font-size: 18px;
  line-height: 1;
}

.lang-label {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #1c1c1e;
  letter-spacing: 0.02em;
}

@media (prefers-color-scheme: dark) {
  .lang-switcher {
    background: rgba(28, 28, 30, 0.75);
    border-color: rgba(255, 255, 255, 0.1);
  }
  .lang-label {
    color: #f2f2f7;
  }
}
</style>
