<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useForm } from '@/shared/composables/useForm'
import { useValidation } from '@/shared/composables/useValidation'
import { useBottomSheet } from '@/shared/composables/useBottomSheet'
import { useToast } from '@/shared/composables/useToast'
import { authApi } from '@/features/auth/api/authApi'
import InputComponent from '@/shared/components/InputComponent.vue'
import ButtonComponent from '@/shared/components/ButtonComponent.vue'

const { t } = useI18n()
const { validators } = useValidation()
const bottomSheet = useBottomSheet()
const toast = useToast()

const showCurrent = ref(false)
const showNew = ref(false)
const showConfirm = ref(false)

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
    current_password: '',
    new_password: '',
    confirm_new_password: '',
  },
  {
    current_password: [
      validators.required(t('auth.form.errors.passwordRequired')),
    ],
    new_password: [
      validators.required(t('auth.form.errors.passwordRequired')),
      validators.minLength(8, t('auth.form.errors.passwordMin')),
      validators.pattern(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        t('auth.form.errors.passwordPattern'),
      ),
      validators.custom(
        (value) => !value || value !== values.current_password,
        t('profile.edit.passwordSameAsCurrent'),
      ),
    ],
    confirm_new_password: [
      validators.required(t('auth.form.errors.passwordMatch')),
      validators.match(
        () => values.new_password,
        t('common.labels.password').toLowerCase(),
        t('profile.edit.passwordMismatch'),
      ),
    ],
  },
  {
    validateOnChange: true,
    onSubmit: async (formValues) => {
      try {
        await authApi.changePassword({
          current_password: formValues.current_password,
          new_password: formValues.new_password,
          confirm_new_password: formValues.confirm_new_password,
        })
        toast.success(t('profile.edit.passwordSaved'))
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
    <InputComponent
      :model-value="values.current_password"
      :type="showCurrent ? 'text' : 'password'"
      :label="t('profile.edit.currentPassword')"
      :error="errors.current_password"
      icon="Lock"
      :icon-right="showCurrent ? 'EyeOff' : 'Eye'"
      :icon-right-size="20"
      autocomplete="current-password"
      @update:model-value="setFieldValue('current_password', $event)"
      @blur="handleBlur('current_password')"
      @icon-click="showCurrent = !showCurrent"
    />
    <InputComponent
      :model-value="values.new_password"
      :type="showNew ? 'text' : 'password'"
      :label="t('profile.edit.newPassword')"
      :error="errors.new_password"
      icon="Lock"
      :icon-right="showNew ? 'EyeOff' : 'Eye'"
      :icon-right-size="20"
      autocomplete="new-password"
      @update:model-value="setFieldValue('new_password', $event)"
      @blur="handleBlur('new_password')"
      @icon-click="showNew = !showNew"
    />
    <InputComponent
      :model-value="values.confirm_new_password"
      :type="showConfirm ? 'text' : 'password'"
      :label="t('profile.edit.confirmPassword')"
      :error="errors.confirm_new_password"
      icon="Lock"
      :icon-right="showConfirm ? 'EyeOff' : 'Eye'"
      :icon-right-size="20"
      autocomplete="new-password"
      @update:model-value="setFieldValue('confirm_new_password', $event)"
      @blur="handleBlur('confirm_new_password')"
      @icon-click="showConfirm = !showConfirm"
    />

    <div class="actions">
      <ButtonComponent variant="ghost" type="button" :disabled="isSubmitting" @click="bottomSheet.close()">
        {{ t('common.buttons.cancel') }}
      </ButtonComponent>
      <ButtonComponent type="submit" variant="primary" full-width :loading="isSubmitting">
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
