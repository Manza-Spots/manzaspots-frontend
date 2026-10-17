<script setup>
import { useI18n } from 'vue-i18n'
import Icon from '@/shared/components/Icon.vue'
import ButtonComponent from '@/shared/components/ButtonComponent.vue'
import { useBottomSheet } from '@/shared/composables/useBottomSheet'

// Al salirse de la ruta no se puede volver a entrar en otro punto: se reinicia
// desde el inicio o se termina. La hoja no se cierra de otra forma.
const props = defineProps({
  onRestart: {
    type: Function,
    required: true,
  },
  onFinish: {
    type: Function,
    required: true,
  },
})

const { t } = useI18n()
const bottomSheet = useBottomSheet()

const choose = (action) => {
  bottomSheet.close()
  action()
}
</script>

<template>
  <div class="restart-route">
    <p class="restart-route__body">{{ t('follow.restart.body') }}</p>

    <ButtonComponent variant="primary" size="lg" full-width @click="choose(props.onRestart)">
      <Icon name="Navigation" :size="18" />
      {{ t('follow.restart.confirm') }}
    </ButtonComponent>
    <ButtonComponent variant="secondary" size="lg" full-width @click="choose(props.onFinish)">
      <Icon name="Square" :size="16" />
      {{ t('follow.controls.finish') }}
    </ButtonComponent>
  </div>
</template>

<style scoped>
.restart-route {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding-bottom: var(--space-4);
}

.restart-route__body {
  margin: 0 0 var(--space-2);
  color: var(--color-text-secondary);
  line-height: 1.5;
}
</style>
