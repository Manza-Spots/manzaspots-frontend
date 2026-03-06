<script setup>
import { usePWA } from '@/shared/composables/usePWA'

const { needRefresh, offlineReady, updateServiceWorker } = usePWA()

const close = () => {
  offlineReady.value = false
  needRefresh.value = false
}
</script>

<template>
  <div v-if="offlineReady || needRefresh" class="pwa-toast">
    <div class="message">
      <span v-if="offlineReady"> La aplicación está lista para funcionar sin conexión </span>
      <span v-else> Hay una nueva versión disponible </span>
    </div>

    <div class="actions">
      <button v-if="needRefresh" @click="updateServiceWorker()" class="btn-update">
        Actualizar
      </button>
      <button @click="close" class="btn-close">Cerrar</button>
    </div>
  </div>
</template>

<style scoped>
.pwa-toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #323232;
  color: white;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  gap: 16px;
  align-items: center;
  max-width: 400px;
  z-index: 9999;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.message {
  flex: 1;
  font-size: 14px;
}

.actions {
  display: flex;
  gap: 8px;
}

button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: opacity 0.2s;
}

button:hover {
  opacity: 0.8;
}

.btn-update {
  background: #4caf50;
  color: white;
}

.btn-close {
  background: transparent;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

@media (max-width: 480px) {
  .pwa-toast {
    bottom: 0;
    right: 0;
    left: 0;
    border-radius: 8px 8px 0 0;
    max-width: none;
  }
}
</style>
