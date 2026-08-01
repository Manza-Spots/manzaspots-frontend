<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from '@/features/auth/composables/useAuth'
import { useBottomSheet } from '@/shared/composables/useBottomSheet'
import { profileApi } from '@/features/profile/api/profileApi'
import { mapSpot } from '@/features/spots/utils/spotMapper'
import Button from '@/shared/components/ButtonComponent.vue'
import Avatar from '@/shared/components/Avatar.vue'
import Icon from '@/shared/components/Icon.vue'
import SpotsMiniMap from '@/features/profile/components/SpotsMiniMap.vue'
import ProfileListSheet from '@/features/profile/components/ProfileListSheet.vue'

const router = useRouter()
const { t, locale } = useI18n()
const { isAuthenticated, user, refreshUser } = useAuth()
const bottomSheet = useBottomSheet()

const goToLogin = () => router.push('/login')
const goToRegister = () => router.push('/register')

const displayName = computed(() => {
  const u = user.value
  if (!u) return ''
  const full = [u.first_name, u.last_name].filter(Boolean).join(' ').trim()
  return full || u.username || u.email || ''
})

const username = computed(() => user.value?.username || '')
const avatarUrl = computed(() => user.value?.profile?.profile_thum_path || '')

const stats = computed(() => {
  const p = user.value?.profile || {}
  return {
    routes: p.routes_created ?? 0,
    spots: p.spots_created ?? 0,
    km: Number(p.distance_traveled_km ?? 0),
  }
})

const memberSince = computed(() => {
  const d = user.value?.date_joined
  if (!d) return ''
  return new Date(d).toLocaleDateString(locale.value, { month: 'short', year: 'numeric' })
})

const mySpots = ref([])

async function loadMySpots() {
  try {
    const raw = await profileApi.getMySpots()
    mySpots.value = raw.map((s) => mapSpot(s, null))
  } catch (error) {
    console.warn('No se pudieron cargar mis spots:', error)
  }
}

onMounted(() => {
  if (isAuthenticated.value) {
    // Asegura stats/avatar frescos desde /me (login puede traer un usuario ligero).
    refreshUser()
    loadMySpots()
  }
})

const openMySpots = () => {
  if (!mySpots.value.length) return
  bottomSheet.open(
    ProfileListSheet,
    { spots: mySpots.value },
    { title: t('profile.mySpots'), closable: true },
  )
}

const openFavorites = async () => {
  try {
    const [rawSpots, routes] = await Promise.all([
      profileApi.getFavoriteSpots(),
      profileApi.getFavoriteRoutes(),
    ])
    bottomSheet.open(
      ProfileListSheet,
      { spots: rawSpots.map((s) => mapSpot(s, null)), routes, removable: true },
      { title: t('profile.favorites'), closable: true },
    )
  } catch (error) {
    console.warn('No se pudieron cargar los favoritos:', error)
  }
}
</script>

<template>
  <div class="profile-view" :class="{ 'profile-view--welcome': !isAuthenticated }">
    <template v-if="isAuthenticated">
      <div class="profile-content">
        <div class="identity">
          <Avatar :src="avatarUrl" :name="displayName" size="xl" shape="circle" />
          <div class="identity-text">
            <h2 class="identity-name">{{ displayName }}</h2>
            <p v-if="username" class="identity-username">@{{ username }}</p>
            <p v-if="memberSince" class="identity-member">
              <Icon name="Calendar" :size="12" />
              {{ t('profile.memberSince', { date: memberSince }) }}
            </p>
          </div>
          <button class="fav-btn" :aria-label="t('profile.favorites')" @click="openFavorites">
            <Icon name="Heart" :size="20" />
          </button>
        </div>

        <div class="stats">
          <div class="stat">
            <div class="stat-value">{{ stats.km.toFixed(1) }}</div>
            <div class="stat-label">{{ t('profile.stats.km') }}</div>
          </div>
          <div class="stat">
            <div class="stat-value">{{ stats.spots }}</div>
            <div class="stat-label">{{ t('profile.stats.spots') }}</div>
          </div>
          <div class="stat">
            <div class="stat-value">{{ stats.routes }}</div>
            <div class="stat-label">{{ t('profile.stats.routes') }}</div>
          </div>
        </div>

        <section class="content-section">
          <div class="section-head">
            <span class="section-label">{{ t('profile.mySpots') }}</span>
            <span v-if="mySpots.length" class="section-count">
              {{ mySpots.length }}
              <Icon name="ChevronRight" :size="14" />
            </span>
          </div>
          <button class="mini-map-card" @click="openMySpots">
            <SpotsMiniMap v-if="mySpots.length" :spots="mySpots" />
            <div v-else class="mini-map-empty">
              <Icon name="MapPinned" :size="28" />
              <span>{{ t('profile.emptySpots') }}</span>
            </div>
          </button>
        </section>

        <section class="content-section">
          <span class="section-label">{{ t('profile.history') }}</span>
          <div class="history-locked">
            <Icon name="Lock" :size="18" />
            <span>{{ t('profile.historyLocked') }}</span>
          </div>
        </section>
      </div>
    </template>

    <template v-else>
      <div class="welcome-container">
        <div class="welcome-hero">
          <div class="welcome-icon-ring">
            <Icon name="MapPin" :size="48" class="welcome-icon" />
          </div>
          <h1 class="welcome-title">{{ $t('profile.welcome.title') }}</h1>
          <p class="welcome-subtitle">
            {{ $t('profile.welcome.subtitle') }}
          </p>
        </div>

        <div class="welcome-actions">
          <Button variant="primary" full-width @click="goToLogin">
            {{ $t('profile.welcome.login') }}
          </Button>
          <Button variant="outline" full-width @click="goToRegister">
            {{ $t('profile.welcome.register') }}
          </Button>
        </div>

        <p class="welcome-footer-text">
          {{ $t('profile.welcome.footer') }}
        </p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.profile-view {
  min-height: 100vh;
  padding-top: calc(var(--safe-area-inset-top) + var(--space-4));
  padding-bottom: calc(120px + var(--safe-area-inset-bottom));
  background: var(--color-bg);
}

.profile-view--welcome {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
  padding-top: calc(var(--safe-area-inset-top) + var(--space-6));
  padding-bottom: calc(120px + var(--safe-area-inset-bottom));
}

.profile-content {
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.identity {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.identity-text {
  flex: 1;
  min-width: 0;
}

.identity-name {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
  margin: 0;
  letter-spacing: -0.02em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.identity-username {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin: 2px 0 0;
}

.identity-member {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  margin: var(--space-1) 0 0;
}

.fav-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-coral);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 0.15s ease;
}

.fav-btn:active {
  transform: scale(0.92);
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-2);
}

.stat {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-4) var(--space-2);
  text-align: center;
}

.stat-value {
  font-size: var(--text-2xl);
  font-weight: var(--font-extrabold);
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}

.stat-label {
  font-size: 11px;
  font-weight: var(--font-bold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-tertiary);
  margin-top: 2px;
}

.content-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
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

.mini-map-card {
  position: relative;
  height: 150px;
  border-radius: var(--radius-xl);
  overflow: hidden;
  border: 1px solid var(--color-border);
  background: var(--color-surface-2);
  padding: 0;
  cursor: pointer;
}

.mini-map-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  height: 100%;
  color: var(--color-text-tertiary);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
}

.history-locked {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  height: 60px;
  padding: 0 var(--space-4);
  border-radius: var(--radius-xl);
  border: 1px dashed var(--color-border-hover);
  background: var(--color-surface-2);
  color: var(--color-text-tertiary);
  font-size: var(--text-sm);
}

.welcome-container {
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.welcome-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: var(--space-10);
}

.welcome-icon-ring {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-6);
}

.welcome-icon {
  color: var(--color-primary);
}

.welcome-title {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-2) 0;
  letter-spacing: -0.02em;
}

.welcome-subtitle {
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  margin: 0;
  line-height: var(--leading-relaxed);
  max-width: 280px;
}

.welcome-actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-bottom: var(--space-8);
}

.welcome-footer-text {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  margin: 0;
  line-height: var(--leading-relaxed);
}
</style>
