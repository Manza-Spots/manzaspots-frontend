<script setup>
import Card from '@/shared/components/Card.vue'
import Button from '@/shared/components/ButtonComponent.vue'
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="terms-view">
    <div class="container">
      <Card padding="lg" class="terms-content">
        <h1>Términos y Condiciones</h1>

        <p>Última actualización: {{ new Date().toLocaleDateString() }}</p>

        <section>
          <h2>1. Aceptación de los términos</h2>
          <p>Al utilizar Hiking Tracker, aceptas estos términos y condiciones.</p>
        </section>

        <section>
          <h2>2. Uso del servicio</h2>
          <p>El servicio está destinado para el seguimiento de rutas de senderismo.</p>
        </section>

        <section>
          <h2>3. Privacidad</h2>
          <p>
            Consulta nuestra
            <router-link to="/privacy" class="link">Política de Privacidad</router-link>
            para más información.
          </p>
        </section>

        <div class="actions">
          <Button variant="primary" @click="router.back()"> Volver </Button>
        </div>
      </Card>
    </div>
  </div>
</template>

<style scoped>
.terms-view {
  min-height: 100vh;
  padding: var(--space-8) 0;
  background-color: var(--color-bg-secondary);
}

.terms-content {
  max-width: 800px;
  margin: 0 auto;
}

h1 {
  margin-bottom: var(--space-4);
}

h2 {
  margin-top: var(--space-6);
  margin-bottom: var(--space-3);
  font-size: var(--text-xl);
}

p {
  margin-bottom: var(--space-4);
  line-height: var(--leading-relaxed);
  color: var(--color-text-secondary);
}

section {
  margin-bottom: var(--space-6);
}

.link {
  color: var(--color-primary);
  font-weight: var(--font-medium);
}

.actions {
  margin-top: var(--space-8);
  padding-top: var(--space-6);
  border-top: 1px solid var(--color-border);
}
</style>
