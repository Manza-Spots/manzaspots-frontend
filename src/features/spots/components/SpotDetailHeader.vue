<script setup>
import { useI18n } from 'vue-i18n'
import Icon from '@/shared/components/Icon.vue'
import IconButton from '@/shared/components/IconButton.vue'
import FavoriteButton from '@/shared/components/FavoriteButton.vue'

defineProps({
  isFavorite: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['back', 'toggle-favorite'])

const { t } = useI18n()
</script>

<template>
  <div class="detail-header">
    <div class="header-col left-col">
      <IconButton :label="t('common.buttons.back')" @click="emit('back')">
        <Icon name="ChevronLeft" :size="24" />
      </IconButton>
    </div>

    <div class="header-col right-col">
      <FavoriteButton
        :active="isFavorite"
        :label="isFavorite ? t('spots.detail.unfavorite') : t('spots.detail.favorite')"
        @toggle="emit('toggle-favorite')"
      />
    </div>
  </div>
</template>

<style scoped>
.detail-header {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: calc(var(--safe-area-inset-top, 20px) + var(--space-4)) var(--space-4) var(--space-4);
  z-index: 25;
  pointer-events: none;
}

.header-col {
  pointer-events: auto;
  display: flex;
  align-items: center;
}

.left-col {
  flex: 1;
  justify-content: flex-start;
}

.right-col {
  flex: 1;
  justify-content: flex-end;
}
</style>
