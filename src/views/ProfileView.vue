<script setup>
import { useAuth } from '@/features/auth/composables/useAuth'
import Button from '@/shared/components/ButtonComponent.vue'
import Avatar from '@/shared/components/Avatar.vue'
import Card from '@/shared/components/Card.vue'

const { user, logout } = useAuth()
</script>

<template>
  <div class="profile-view">
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
  </div>
</template>

<style scoped>
.profile-view {
  min-height: 100vh;
  padding-top: calc(var(--safe-area-inset-top) + var(--space-4));
  padding-bottom: calc(120px + var(--safe-area-inset-bottom));
  background: var(--color-bg);
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
</style>
