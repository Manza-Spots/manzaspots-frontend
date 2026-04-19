<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Icon from '@/shared/components/Icon.vue'
import Input from '@/shared/components/InputComponent.vue'
import Button from '@/shared/components/ButtonComponent.vue'
import { useForm } from '@/shared/composables/useForm'
import { useValidation } from '@/shared/composables/useValidation'
import { useAuth } from '@/features/auth/composables/useAuth'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const route = useRoute()
const { confirmPasswordReset } = useAuth()
const { t } = useI18n()
const { validators } = useValidation()

const resetSuccess = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const uidb64 = ref('')
const token = ref('')

onMounted(() => {
  if (route.query.uidb64 && route.query.token) {
    uidb64.value = route.query.uidb64
    token.value = route.query.token
    router.replace({ path: route.path, query: {} })
  }
})

const togglePassword = () => {
  showPassword.value = !showPassword.value
}

const toggleConfirmPassword = () => {
  showConfirmPassword.value = !showConfirmPassword.value
}

const { values, errors, isSubmitting, setFieldValue, handleBlur, handleSubmit, setErrors } =
  useForm(
    {
      password: '',
      confirmPassword: '',
    },
    {
      password: [
        validators.required(t('auth.form.errors.passwordRequired')),
        validators.minLength(8, t('auth.form.errors.passwordMin')),
        validators.pattern(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
          t('auth.form.errors.passwordPattern')
        ),
      ],
      confirmPassword: [
        validators.required(t('auth.form.errors.passwordMatch')),
        validators.match(
          () => values.password,
          t('common.labels.password').toLowerCase(),
          t('auth.form.errors.passwordMatch')
        ),
      ],
    },
    {
      onSubmit: async (formValues) => {
        try {
          if (!uidb64.value || !token.value) {
            setErrors({ password: t('auth.reset.errors.invalidLink') })
            return
          }

          await confirmPasswordReset({
            uidb64: uidb64.value,
            token: token.value,
            new_password: formValues.password,
            confirm_new_password: formValues.confirmPassword
          })
          
          resetSuccess.value = true
        } catch (error) {
          if (error.fieldErrors) {
            setErrors(error.fieldErrors)
          }
        }
      },
    }
  )

</script>

<template>
  <div class="reset-password-view">
    <button v-if="!resetSuccess" class="back-button" @click="router.push('/login')">
      <Icon name="ArrowLeft"/>
    </button>
    <div class="reset-container">
      
      <template v-if="!resetSuccess">
        <div class="reset-header">
          <h1 class="title">{{ $t('auth.reset.title') }}</h1>
          <p class="subtitle">{{ $t('auth.reset.subtitle') }}</p>
        </div>

        <form class="reset-form" @submit="handleSubmit">
          <Input
            :model-value="values.password"
            :type="showPassword ? 'text' : 'password'"
            :label="$t('auth.reset.labels.newPassword')"
            :placeholder="$t('common.placeholders.password')"
            icon="Lock"
            :icon-right="showPassword ? 'EyeOff' : 'Eye'"
            autocomplete="new-password"
            :error="errors.password"
            :disabled="isSubmitting"
            @update:model-value="setFieldValue('password', $event)"
            @blur="handleBlur('password')"
            @icon-click="togglePassword"
          />

          <Input
            :model-value="values.confirmPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            :label="$t('auth.reset.labels.confirmNewPassword')"
            :placeholder="$t('common.placeholders.password')"
            icon="Lock"
            :icon-right="showConfirmPassword ? 'EyeOff' : 'Eye'"
            autocomplete="new-password"
            :error="errors.confirmPassword"
            :disabled="isSubmitting"
            @update:model-value="setFieldValue('confirmPassword', $event)"
            @blur="handleBlur('confirmPassword')"
            @icon-click="toggleConfirmPassword"
          />

          <Button
            type="submit"
            variant="primary"
            full-width
            :loading="isSubmitting"
            :disabled="isSubmitting"
            class="submit-button"
          >
            {{ $t('auth.reset.submit') }}
          </Button>
        </form>
      </template>

      <template v-else>
        <div class="success-header">
          <div class="icon-circle">
            <Icon name="Check" size="32" class="success-icon" />
          </div>
          <h1 class="title">{{ $t('auth.reset.success.title') }}</h1>
          <p class="subtitle">
            {{ $t('auth.reset.success.message') }}
          </p>
          <Button
            variant="primary"
            full-width
            class="back-login-btn"
            @click="router.push('/login')"
          >
            {{ $t('auth.reset.success.cta') }}
          </Button>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.reset-password-view {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-primary, var(--color-bg));
}

.back-button {
  position: absolute;
  top: calc(var(--safe-area-inset-top) + var(--space-4));
  left: calc(var(--safe-area-inset-left) + var(--space-4));
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  color: var(--color-text-primary);
  transition: transform 0.2s ease;
}

.back-button:active {
  transform: scale(0.9);
}

.reset-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  max-width: 100%;
  padding-top: calc(var(--safe-area-inset-top) + var(--space-10));
  padding-bottom: calc(120px + var(--safe-area-inset-bottom));
  padding-left: calc(var(--safe-area-inset-left) + var(--space-6));
  padding-right: calc(var(--safe-area-inset-right) + var(--space-6));
}

.reset-header {
  text-align: center;
  margin-bottom: var(--space-5);
}

.title {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-2);
}

.subtitle {
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  line-height: var(--leading-relaxed);
  margin: 0;
}

.reset-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.submit-button {
  margin-top: var(--space-2);
}

.success-header {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.icon-circle {
  width: 80px;
  height: 80px;
  background-color: var(--color-success-light, rgba(52, 168, 83, 0.1));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-success, #34A853);
  margin-bottom: var(--space-5);
}

.back-login-btn {
  margin-top: var(--space-6);
}

@media (min-width: 768px) {
  .reset-password-view {
    align-items: center;
    justify-content: center;
  }

  .reset-container {
    max-width: 440px;
  }
}
</style>
