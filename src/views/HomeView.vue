<script setup>
import { useRouter } from 'vue-router'
import Button from '@/shared/components/ButtonComponent.vue'

const router = useRouter()

</script>

<template>
  <div class="home">
    <div class="container">
      <div class="hero">
        <h1>Manza Spots</h1>

        <div class="actions">
          <Button variant="primary" size="lg" @click="router.push({ name: 'Login' })">
            Iniciar Sesión
          </Button>
          <Button variant="outline" size="lg" @click="router.push({ name: 'Register' })">
            Registrarse
          </Button>
          <Button variant="ghost" size="md" @click="router.push({ name: 'UiShowCase' })">
            Ver UI
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero {
  text-align: center;
  color: black;
}

.hero h1 {
  font-size: var(--text-5xl);
  margin-bottom: var(--space-8);
  color: rgb(0, 0, 0);
}

.actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  max-width: 300px;
  margin: 0 auto;
}
</style>
