<template>
  <div class="record-route-view">
    <div class="record-route-header">
      <h1>{{ $t('navigation.record') }}</h1>
    </div>

    <div class="record-route-content">
      <p>{{ $t('common.status.pendingContent') }}</p>
    </div>
  </div>
</template>

<style scoped>
.record-route-view {
  min-height: 100vh;
  padding-top: calc(var(--safe-area-inset-top) + var(--space-4));
  padding-bottom: calc(120px + var(--safe-area-inset-bottom));
  background: var(--color-bg);
}

.record-route-header {
  padding: var(--space-6) var(--space-4) var(--space-4);
}

.record-route-header h1 {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
  margin: 0;
}

.record-route-content {
  padding: var(--space-4);
}
</style>
