<script setup>
import { ref, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '@/shared/components/Icon.vue'
import ButtonComponent from '@/shared/components/ButtonComponent.vue'
import Textarea from '@/shared/components/Textarea.vue'
import { useBottomSheet } from '@/shared/composables/useBottomSheet'
import { useToast } from '@/shared/composables/useToast'
import { spotsApi } from '@/features/spots/api/spotsApi'

const props = defineProps({
  spotId: {
    type: [Number, String],
    required: true,
  },
  // Foto ya elegida (y comprimida) por el usuario.
  file: {
    type: File,
    required: true,
  },
  onAdded: {
    type: Function,
    default: () => {},
  },
})

const { t } = useI18n()
const toast = useToast()
const bottomSheet = useBottomSheet()

const previewUrl = URL.createObjectURL(props.file)
const description = ref('')
const uploading = ref(false)

async function upload() {
  if (uploading.value) return
  uploading.value = true
  try {
    await spotsApi.addPhoto(props.spotId, {
      file: props.file,
      description: description.value.trim(),
    })
    toast.success(t('spots.detail.photoAdded'))
    bottomSheet.close()
    props.onAdded()
  } catch (error) {
    toast.error(error.message || t('common.errors.generic'))
  } finally {
    uploading.value = false
  }
}

onUnmounted(() => URL.revokeObjectURL(previewUrl))
</script>

<template>
  <div class="add-photo">
    <img :src="previewUrl" alt="" class="preview" />

    <Textarea
      v-model="description"
      :label="t('spots.detail.photoDescription')"
      :placeholder="t('spots.detail.photoDescriptionPlaceholder')"
      :rows="2"
    />

    <ButtonComponent variant="primary" size="lg" full-width :loading="uploading" @click="upload">
      <Icon name="Upload" :size="18" />
      {{ t('spots.detail.uploadPhoto') }}
    </ButtonComponent>
  </div>
</template>

<style scoped>
.add-photo {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding-bottom: var(--space-4);
}

.preview {
  width: 100%;
  max-height: 280px;
  object-fit: cover;
  border-radius: var(--radius-xl);
}
</style>
