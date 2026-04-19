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
        <h1>{{ $t('legal.privacy.title') }}</h1>

        <p>{{ $t('legal.privacy.updated') }}: {{ new Date().toLocaleDateString() }}</p>

        <section>
          <h2>{{ $t('legal.privacy.sections.info.title') }}</h2>
          <p>{{ $t('legal.privacy.sections.info.intro') }}</p>
          <ul>
            <li v-for="(item, index) in $tm('legal.privacy.sections.info.items')" :key="index">
              {{ $rt(item) }}
            </li>
          </ul>
        </section>

        <section>
          <h2>{{ $t('legal.privacy.sections.usage.title') }}</h2>
          <p>{{ $t('legal.privacy.sections.usage.intro') }}</p>
          <ul>
            <li v-for="(item, index) in $tm('legal.privacy.sections.usage.items')" :key="index">
              {{ $rt(item) }}
            </li>
          </ul>
        </section>

        <section>
          <h2>{{ $t('legal.privacy.sections.sharing.title') }}</h2>
          <p>{{ $t('legal.privacy.sections.sharing.text') }}</p>
        </section>

        <section>
          <h2>{{ $t('legal.privacy.sections.security.title') }}</h2>
          <p>{{ $t('legal.privacy.sections.security.text') }}</p>
        </section>

        <div class="actions">
          <Button variant="primary" @click="router.back()"> {{ $t('common.buttons.back') }} </Button>
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
