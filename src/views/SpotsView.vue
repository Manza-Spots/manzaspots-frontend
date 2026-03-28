<script setup>
// Ya no necesita el SearchBar, todo vive en BottomNav
</script>

<template>
  <div class="spots-view">
    <div class="spots-header">
      <h1>Spots</h1>
    </div>

    <div class="spots-content">
      <p>Vista de Spots - Contenido pendiente</p>
    </div>
  </div>
</template>

<style scoped>
.spots-view {
  min-height: 100vh;
  padding-top: calc(var(--safe-area-inset-top) + var(--space-4));
  padding-bottom: calc(100px + var(--safe-area-inset-bottom));
  background: var(--color-bg);
}

.spots-header {
  padding: var(--space-6) var(--space-4) var(--space-4);
}

.spots-header h1 {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
  margin: 0;
}

.spots-content {
  padding: var(--space-4);
}
</style>
