<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useForm } from '@/shared/composables/useForm'
import { useValidation } from '@/shared/composables/useValidation'
import { useAuth } from '@/features/auth/composables/useAuth'
import { useBottomSheet } from '@/shared/composables/useBottomSheet'
import { useToast } from '@/shared/composables/useToast'
import { profileApi } from '@/features/profile/api/profileApi'
import Icon from '@/shared/components/Icon.vue'
import InputComponent from '@/shared/components/InputComponent.vue'
import ButtonComponent from '@/shared/components/ButtonComponent.vue'

const { t } = useI18n()
const { validators } = useValidation()
const { user } = useAuth()
const bottomSheet = useBottomSheet()
const toast = useToast()

const showPassword = ref(false)

const {
  values,
  errors,
  isSubmitting,
  setFieldValue,
  handleBlur,
  handleSubmit,
  setErrors,
} = useForm(
  {
    email: '',
    password: '',
  },
  {
    email: [
      validators.required(t('common.errors.required')),
      validators.email(t('common.errors.email')),
      validators.custom(
        (value) => !value || value.trim().toLowerCase() !== (user.value?.email || '').toLowerCase(),
        t('profile.edit.emailSame'),
      ),
    ],
    password: [
      validators.required(t('auth.form.errors.passwordRequired')),
    ],
  },
  {
    validateOnChange: true,
    onSubmit: async (formValues) => {
      try {
        await profileApi.requestEmailChange({
          email: formValues.email.trim().toLowerCase(),
          password: formValues.password,
        })
        toast.success(t('profile.edit.emailRequested'))
        bottomSheet.close()
      } catch (error) {
        if (error.fieldErrors) {
          setErrors(error.fieldErrors)
        } else {
          toast.error(error.message || t('common.errors.generic'))
        }
      }
    },
  },
)
</script>

<template>
  <form class="edit-form" @submit="handleSubmit">
    <p class="current-email">
      {{ t('profile.edit.currentEmail') }} <strong>{{ user?.email }}</strong>
    </p>

    <InputComponent
      :model-value="values.email"
      type="email"
      :label="t('profile.edit.newEmail')"
      :placeholder="t('common.placeholders.email')"
      :error="errors.email"
      icon="Mail"
      autocomplete="email"
      @update:model-value="setFieldValue('email', $event)"
      @blur="handleBlur('email')"
    />
    <InputComponent
      :model-value="values.password"
      :type="showPassword ? 'text' : 'password'"
      :label="t('profile.edit.confirmWithPassword')"
      :error="errors.password"
      icon="Lock"
      :icon-right="showPassword ? 'EyeOff' : 'Eye'"
      :icon-right-size="20"
      autocomplete="current-password"
      @update:model-value="setFieldValue('password', $event)"
      @blur="handleBlur('password')"
      @icon-click="showPassword = !showPassword"
    />

    <p class="hint">
      <Icon name="Info" :size="15" />
      {{ t('profile.edit.emailHint') }}
    </p>

    <div class="actions">
      <ButtonComponent variant="ghost" type="button" :disabled="isSubmitting" @click="bottomSheet.close()">
        {{ t('common.buttons.cancel') }}
      </ButtonComponent>
      <ButtonComponent type="submit" variant="primary" full-width :loading="isSubmitting">
        {{ t('profile.edit.sendLink') }}
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

.current-email {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.hint {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  margin: 0;
  padding: var(--space-3);
  border-radius: var(--radius-lg);
  background: var(--color-surface-2);
  color: var(--color-text-tertiary);
  font-size: var(--text-xs);
  line-height: var(--leading-relaxed);
}

.actions {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-2);
}
</style>
