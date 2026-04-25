<script setup>
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import Icon from '@/shared/components/Icon.vue'
import ButtonComponent from '@/shared/components/ButtonComponent.vue'
import { useAuth } from '@/features/auth/composables/useAuth'
import { useTheme } from '@/shared/composables/useTheme'
import { Preferences } from '@capacitor/preferences'

const { t, locale } = useI18n()
const emit = defineEmits(['close'])

const { isAuthenticated, logout } = useAuth()

const handleLogout = async () => {
  emit('close')
  await logout()
}

const { currentTheme, setTheme } = useTheme()

const onThemeChange = (e) => {
  setTheme(e.target.value)
}

const onLanguageChange = async (e) => {
  const newLang = e.target.value
  locale.value = newLang

  // Grabamos en nativo
  try {
    await Preferences.set({ key: 'manzaspots_language_preference', value: newLang })
  } catch (error) {
    console.warn('No se pudo guardar la preferencia de idioma', error)
  }
}
</script>

<template>
  <div class="settings-menu">
    <div class="settings-section">
      <h4 class="section-title">{{ t('settings.preferences', 'Preferencias') }}</h4>

      <div class="setting-item">
        <div class="setting-info">
          <Icon name="Moon" :size="20" class="setting-icon" />
          <span>{{ t('settings.theme', 'Tema') }}</span>
        </div>
        <select class="setting-select" :value="currentTheme" @change="onThemeChange">
          <option value="light">{{ t('settings.themeLight', 'Claro') }}</option>
          <option value="dark">{{ t('settings.themeDark', 'Oscuro') }}</option>
          <option value="system">{{ t('settings.themeSystem', 'Sistema') }}</option>
        </select>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <Icon name="Globe" :size="20" class="setting-icon" />
          <span>{{ t('settings.language', 'Idioma') }}</span>
        </div>
        <select class="setting-select" :value="locale" @change="onLanguageChange">
          <option value="es">Español (ES)</option>
          <option value="en">English (EN)</option>
        </select>
      </div>
    </div>

    <div class="settings-section">
      <h4 class="section-title">{{ t('settings.legal', 'Legal') }}</h4>

      <RouterLink to="/terms" class="setting-item clickable" @click="emit('close')">
        <div class="setting-info">
          <Icon name="FileText" :size="20" class="setting-icon" />
          <span>{{ t('settings.terms', 'Términos de uso') }}</span>
        </div>
        <Icon name="ChevronRight" :size="20" class="setting-icon-action" />
      </RouterLink>

      <RouterLink to="/privacy" class="setting-item clickable" @click="emit('close')">
        <div class="setting-info">
          <Icon name="Shield" :size="20" class="setting-icon" />
          <span>{{ t('settings.privacy', 'Política de privacidad') }}</span>
        </div>
        <Icon name="ChevronRight" :size="20" class="setting-icon-action" />
      </RouterLink>
    </div>

    <div class="actions-section">
      <ButtonComponent
        v-if="isAuthenticated"
        variant="danger"
        size="sm"
        fullWidth
        @click="handleLogout"
      >
        <Icon name="LogOut" :size="18" />
        {{ t('common.buttons.logout', 'Cerrar Sesión') }}
      </ButtonComponent>
    </div>
  </div>
</template>

<style scoped>
.settings-menu {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding-top: var(--space-2);
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.actions-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-top: var(--space-4);
  padding-top: var(--space-2);
}

.section-title {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  font-weight: var(--font-medium);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding-bottom: var(--space-2);
  margin-bottom: var(--space-1);
  border-bottom: 1px solid var(--color-gray-100);
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) 0;
  text-decoration: none;
  color: inherit;
}

.setting-item.clickable {
  cursor: pointer;
  transition: opacity var(--transition-fast);
}

.setting-item.clickable:active {
  opacity: 0.6;
}

.setting-info {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  color: var(--color-text-primary);
  font-weight: var(--font-medium);
}

.setting-icon {
  color: var(--color-gray-500);
}

.setting-icon-action {
  color: var(--color-gray-400);
}

.setting-select {
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-gray-200);
  background-color: var(--color-bg);
  color: var(--color-text-primary);
  font-family: inherit;
  font-size: var(--text-sm);
  outline: none;
  min-width: 100px;
}

.setting-select:focus {
  border-color: var(--color-primary);
}

@media (prefers-color-scheme: dark) {
  /* Si el sistema es dark o se fuerza la clase .dark, var(--color-gray-100) cambiaría si está definida adaptativamente en variables.css. */
}
</style>
