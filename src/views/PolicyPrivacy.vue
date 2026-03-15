<script setup>
import Card from '@/shared/components/Card.vue'
import Button from '@/shared/components/ButtonComponent.vue'
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="privacy-view">
    <div class="container">
      <Card padding="lg" class="privacy-content">
        <h1>Política de Privacidad</h1>

        <p>Última actualización: {{ new Date().toLocaleDateString() }}</p>

        <section>
          <h2>1. Información que recopilamos</h2>
          <p>Recopilamos información que nos proporcionas directamente:</p>
          <ul>
            <li>Información de cuenta (email, nombre)</li>
            <li>Datos de ubicación para tracking de rutas</li>
            <li>Información de uso de la aplicación</li>
          </ul>
        </section>

        <section>
          <h2>2. Cómo usamos tu información</h2>
          <p>Utilizamos la información recopilada para:</p>
          <ul>
            <li>Proporcionar y mejorar nuestros servicios</li>
            <li>Trackear tus rutas de senderismo</li>
            <li>Comunicarnos contigo</li>
          </ul>
        </section>

        <section>
          <h2>3. Compartir información</h2>
          <p>No compartimos tu información personal con terceros sin tu consentimiento.</p>
        </section>

        <section>
          <h2>4. Seguridad</h2>
          <p>Implementamos medidas de seguridad para proteger tu información.</p>
        </section>

        <div class="actions">
          <Button variant="primary" @click="router.back()"> Volver </Button>
        </div>
      </Card>
    </div>
  </div>
</template>

<style scoped>
.privacy-view {
  min-height: 100vh;
  padding: var(--space-8) 0;
  background-color: var(--color-bg-secondary);
}

.privacy-content {
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

ul {
  margin-left: var(--space-6);
  margin-bottom: var(--space-4);
  line-height: var(--leading-relaxed);
  color: var(--color-text-secondary);
}

li {
  margin-bottom: var(--space-2);
}

section {
  margin-bottom: var(--space-6);
}

.actions {
  margin-top: var(--space-8);
  padding-top: var(--space-6);
  border-top: 1px solid var(--color-border);
}
</style>
