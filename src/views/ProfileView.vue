<script setup>
import { ref } from 'vue'
import { useAuth } from '@/features/auth/composables/useAuth'
import LoginView from '@/features/auth/views/LoginView.vue'
import RegisterView from '@/features/auth/views/RegisterView.vue'
import Button from '@/shared/components/ButtonComponent.vue'
import Avatar from '@/shared/components/Avatar.vue'
import Card from '@/shared/components/Card.vue'

const { isAuthenticated, user, logout } = useAuth()

const authMode = ref('login')

const switchToRegister = () => {
  authMode.value = 'register'
}

const switchToLogin = () => {
  authMode.value = 'login'
}
</script>

<template>
  <div class="profile-view" :class="{ 'profile-view--auth': !isAuthenticated }">
    <!-- Authenticated: show profile -->
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

    <!-- Not authenticated: show login or register -->
    <template v-else>
      <div class="auth-container">
        <Transition name="auth-slide" mode="out-in">
          <LoginView
            v-if="authMode === 'login'"
            key="login"
            @switch-to-register="switchToRegister"
          />
          <RegisterView
            v-else
            key="register"
            @switch-to-login="switchToLogin"
          />
        </Transition>
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

/* When showing auth forms: fixed-height scroll container */
.profile-view--auth {
  height: 100vh;
  min-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
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

/* Auth container — fills viewport, scroll happens on .profile-view--auth */
.auth-container {
  position: relative;
}

/* Slide transition for auth forms */
.auth-slide-enter-active,
.auth-slide-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.auth-slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.auth-slide-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
</style>
