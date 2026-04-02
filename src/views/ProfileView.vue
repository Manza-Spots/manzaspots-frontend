<script setup>
import { useRouter } from 'vue-router'
import { useAuth } from '@/features/auth/composables/useAuth'
import Button from '@/shared/components/ButtonComponent.vue'
import Avatar from '@/shared/components/Avatar.vue'
import Card from '@/shared/components/Card.vue'
import Icon from '@/shared/components/Icon.vue'

const router = useRouter()
const { isAuthenticated, user, logout } = useAuth()

const goToLogin = () => router.push('/login')
const goToRegister = () => router.push('/register')
</script>

<template>
  <div class="profile-view" :class="{ 'profile-view--welcome': !isAuthenticated }">
    <template v-if="isAuthenticated">
      <div class="profile-header">
        <h1>Perfil</h1>
      </div>

      <div class="profile-content">
        <Card padding="lg" class="profile-card">
          <div class="profile-info">
            <Avatar :name="user?.email" size="xl" />
            <div class="user-details">
              <h2>{{ user?.email || 'Usuario' }}</h2>
              <p>{{ user?.first_name || 'Sin nombre' }}</p>
            </div>
          </div>

          <Button variant="danger" full-width @click="logout"> Cerrar Sesión </Button>
        </Card>
      </div>
    </template>

    <template v-else>
      <div class="welcome-container">
        <div class="welcome-hero">
          <div class="welcome-icon-ring">
            <Icon name="MapPin" :size="48" class="welcome-icon" />
          </div>
          <h1 class="welcome-title">Manza Spots</h1>
          <p class="welcome-subtitle">
            Descubre, comparte y guarda los mejores lugares de tu ciudad
          </p>
        </div>

        <div class="welcome-actions">
          <Button variant="primary" full-width @click="goToLogin">
            Iniciar sesión
          </Button>
          <Button variant="outline" full-width @click="goToRegister">
            Crear cuenta
          </Button>
        </div>

        <p class="welcome-footer-text">
          Explora libremente o crea tu cuenta para guardar tus spots favoritos
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

.profile-header {
  padding: var(--space-6) var(--space-4) var(--space-4);
}

.profile-header h1 {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
  margin: 0;
}

.profile-content {
  padding: var(--space-4);
}

.profile-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.profile-info {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.user-details h2 {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-1) 0;
}

.user-details p {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin: 0;
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
