<script setup>
import { ref, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuth } from '@/features/auth/composables/useAuth'
import { useBottomSheet } from '@/shared/composables/useBottomSheet'
import { useToast } from '@/shared/composables/useToast'
import { profileApi } from '@/features/profile/api/profileApi'
import InputComponent from '@/shared/components/InputComponent.vue'
import ButtonComponent from '@/shared/components/ButtonComponent.vue'

const { t } = useI18n()
const { user, refreshUser } = useAuth()
const bottomSheet = useBottomSheet()
const toast = useToast()

const form = reactive({
  first_name: user.value?.first_name || '',
  last_name: user.value?.last_name || '',
  username: user.value?.username || '',
})
const errors = reactive({ first_name: '', last_name: '', username: '' })
const loading = ref(false)

function resetErrors() {
  errors.first_name = ''
  errors.last_name = ''
  errors.username = ''
}

async function submit() {
  resetErrors()

  const username = form.username.trim()
  if (!username) {
    errors.username = t('common.errors.required')
    return
  }

  // Enviamos solo lo que cambió respecto al usuario actual.
  const payload = {}
  if (form.first_name.trim() !== (user.value?.first_name || '')) payload.first_name = form.first_name.trim()
  if (form.last_name.trim() !== (user.value?.last_name || '')) payload.last_name = form.last_name.trim()
  if (username !== (user.value?.username || '')) payload.username = username

  if (!Object.keys(payload).length) {
    bottomSheet.close()
    return
  }

  loading.value = true
  try {
    await profileApi.updateProfile(user.value.id, payload)
    await refreshUser()
    toast.success(t('profile.edit.profileSaved'))
    bottomSheet.close()
  } catch (error) {
    if (error.fieldErrors) {
      Object.assign(errors, error.fieldErrors)
    } else {
      toast.error(error.message || t('common.errors.generic'))
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <form class="edit-form" @submit.prevent="submit">
    <InputComponent
      v-model="form.first_name"
      :label="t('profile.edit.firstName')"
      :error="errors.first_name"
      icon="User"
      autocomplete="given-name"
    />
    <InputComponent
      v-model="form.last_name"
      :label="t('profile.edit.lastName')"
      :error="errors.last_name"
      icon="User"
      autocomplete="family-name"
    />
    <InputComponent
      v-model="form.username"
      :label="t('common.labels.username')"
      :error="errors.username"
      icon="AtSign"
      autocomplete="username"
    />

    <div class="actions">
      <ButtonComponent variant="ghost" type="button" :disabled="loading" @click="bottomSheet.close()">
        {{ t('common.buttons.cancel') }}
      </ButtonComponent>
      <ButtonComponent type="submit" variant="primary" full-width :loading="loading">
        {{ t('common.buttons.save') }}
      </ButtonComponent>
    </div>
  </form>
</template>

<style scoped>
.edit-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding-top: var(--space-2);
}

.actions {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-2);
}
</style>
