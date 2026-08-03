<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useForm } from '@/shared/composables/useForm'
import { useValidation } from '@/shared/composables/useValidation'
import Input from '@/shared/components/InputComponent.vue'
import Button from '@/shared/components/ButtonComponent.vue'
import Checkbox from '@/shared/components/CheckboxComponent.vue'
import Icon from '@/shared/components/Icon.vue'
import { useAuth } from '../composables/useAuth'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { register } = useAuth()
const { t } = useI18n()
const { validators } = useValidation()



const showPassword = ref(false)
const showConfirmPassword = ref(false)

const { values, errors, isSubmitting, setFieldValue, handleBlur, handleSubmit, setErrors } = useForm(
  {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  },
  {
    username: [
      validators.required(t('auth.form.errors.usernameRequired')),
      validators.alphanumeric(),
      validators.minLength(5, t('auth.form.errors.usernameMin')),
    ],
    email: [
      validators.required(t('auth.form.errors.emailRequired')), 
      validators.email(t('auth.form.errors.emailRequired'))
    ],
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
    acceptTerms: [
      validators.custom((value) => value === true, t('auth.form.errors.terms')),
    ],
  },
  {
    onSubmit: async (formValues) => {
      try {
        await register(
          {
            username: formValues.username,
            email: formValues.email,
            password: formValues.password,
            confirmPassword: formValues.confirmPassword
          },
          '/email-verified'
        )
      } catch (error) {
        if(error.fieldErrors) {
          setErrors(error.fieldErrors)
        }
      }
    },
  }
)

const togglePassword = () => {
  showPassword.value = !showPassword.value
}

const toggleConfirmPassword = () => {
  showConfirmPassword.value = !showConfirmPassword.value
}

const goToLogin = () => router.push('/login')

const goToTermsAndConditions = () => router.push('/terms')

const goToPolicyPrivacy = () => router.push('/privacy')

const goToProfile = () => router.push('/profile')

</script>

<template>
  <div class="register-view">
    <button class="back-button" @click="goToProfile()">
      <Icon name="ArrowLeft"/>
    </button>
    <div class="register-container">
      <div class="register-header">
        <h1 class="title">{{ $t('auth.register.title') }}</h1>
        <p class="subtitle">{{ $t('auth.register.subtitle') }}</p>
      </div>

      <form class="register-form" @submit="handleSubmit">
        <Input
          :model-value="values.username"
          type="text"
          :label="$t('common.labels.username')"
          :placeholder="$t('auth.register.username_placeholder')"
          icon="User"
          autocomplete="username"
          :error="errors.username"
          @update:model-value="setFieldValue('username', $event)"
          @blur="handleBlur('username')"
        />

        <Input
          :model-value="values.email"
          type="email"
          :label="$t('common.labels.email')"
          :placeholder="$t('common.placeholders.email')"
          icon="Mail"
          autocomplete="email"
          :error="errors.email"
          @update:model-value="setFieldValue('email', $event)"
          @blur="handleBlur('email')"
        />

        <Input
          :model-value="values.password"
          :type="showPassword ? 'text' : 'password'"
          :label="$t('common.labels.password')"
          :placeholder="$t('common.placeholders.password')"
          icon="Lock"
          :icon-right="showPassword ? 'EyeOff' : 'Eye'"
          autocomplete="new-password"
          :icon-right-size="22"
          :error="errors.password"
          @update:model-value="setFieldValue('password', $event)"
          @blur="handleBlur('password')"
          @icon-click="togglePassword"
        />

        <Input
          :model-value="values.confirmPassword"
          :type="showConfirmPassword ? 'text' : 'password'"
          :label="$t('auth.form.labels.confirmPassword')"
          :placeholder="$t('common.placeholders.password')"
          icon="Lock"
          :icon-right="showConfirmPassword ? 'EyeOff' : 'Eye'"
          autocomplete="new-password"
          :icon-right-size="22"
          :error="errors.confirmPassword"
          @update:model-value="setFieldValue('confirmPassword', $event)"
          @blur="handleBlur('confirmPassword')"
          @icon-click="toggleConfirmPassword"
        />

        <div class="terms-field">
          <Checkbox
            :model-value="values.acceptTerms"
            size="sm"
            :error="errors.acceptTerms"
            @update:model-value="setFieldValue('acceptTerms', $event)"
            @blur="handleBlur('acceptTerms')"
          >
            <span class="terms-text">
              {{ $t('auth.register.terms.accept') }}
              <button type="button" class="terms-link" @click="goToTermsAndConditions()">
                {{ $t('auth.register.terms.link') }}
              </button>
              {{ $t('auth.register.terms.and') }}
              <button type="button" class="terms-link" @click="goToPolicyPrivacy()">
                {{ $t('auth.register.terms.privacy') }}
              </button>
            </span>
          </Checkbox>
        </div>

        <Button
          type="submit"
          variant="primary"
          full-width
          :loading="isSubmitting"
          :disabled="isSubmitting"
        >
          {{ $t('auth.register.submit') }}
        </Button>
      </form>

      <div class="divider">
        <span>{{ $t('auth.register.orRegisterWith') }}</span>
      </div>

      <div class="social-register">
        <button type="button" class="social-button">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M19.8 10.2273C19.8 9.51818 19.7364 8.83636 19.6182 8.18182H10.2V12.05H15.6109C15.3727 13.3 14.6582 14.3591 13.5864 15.0682V17.5773H16.8182C18.7091 15.8364 19.8 13.2727 19.8 10.2273Z"
              fill="#4285F4"
            />
            <path
              d="M10.2 20C12.9 20 15.1709 19.1045 16.8182 17.5773L13.5864 15.0682C12.6864 15.6682 11.5491 16.0227 10.2 16.0227C7.59545 16.0227 5.38182 14.2636 4.58636 11.9H1.25455V14.4909C2.89091 17.7591 6.29545 20 10.2 20Z"
              fill="#34A853"
            />
            <path
              d="M4.58636 11.9C4.38636 11.3 4.27273 10.6591 4.27273 10C4.27273 9.34091 4.38636 8.7 4.58636 8.1V5.50909H1.25455C0.572727 6.86364 0.2 8.38636 0.2 10C0.2 11.6136 0.572727 13.1364 1.25455 14.4909L4.58636 11.9Z"
              fill="#FBBC05"
            />
            <path
              d="M10.2 3.97727C11.6682 3.97727 12.9864 4.48182 14.0273 5.47273L16.8909 2.60909C15.1664 0.990909 12.8955 0 10.2 0C6.29545 0 2.89091 2.24091 1.25455 5.50909L4.58636 8.1C5.38182 5.73636 7.59545 3.97727 10.2 3.97727Z"
              fill="#EA4335"
            />
          </svg>
          {{ $t('auth.google') }}
        </button>

        <button type="button" class="social-button apple">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M16.365 1.43c0 1.14-.465 2.17-1.215 2.94-.75.78-1.98 1.38-3.03 1.29-.135-1.11.435-2.25 1.14-2.97.78-.81 2.085-1.395 3.105-1.26zM20.49 17.19c-.48 1.08-.705 1.56-1.32 2.52-.855 1.335-2.055 3.015-3.54 3.03-1.32.015-1.665-.855-3.465-.855-1.8 0-2.175.84-3.495.87-1.485.06-2.625-1.47-3.48-2.805-2.385-3.69-2.64-8.01-1.17-10.26 1.035-1.605 2.67-2.55 4.2-2.55 1.56 0 2.55.855 3.84.855 1.26 0 2.025-.855 3.825-.855 1.365 0 2.82.75 3.855 2.04-3.405 1.86-2.85 6.72.75 7.98z"
            />
          </svg>
          {{ $t('auth.apple') }}
        </button>
      </div>

      <div class="register-footer">
        <p>
          {{ $t('auth.register.alreadyHaveAccount') }}
          <button type="button" class="link" @click="goToLogin">{{ $t('auth.login') }}</button>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-view {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
}

.back-button {
  position: absolute;
  top: calc(var(--safe-area-inset-top) + var(--space-4));
  left: calc(var(--safe-area-inset-left) + var(--space-4));
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  color: var(--color-text-primary);
  transition: var(--press-transition);
}

.back-button:active {
  transform: scale(var(--press-scale-strong));
}

.register-container {
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

.register-header {
  text-align: center;
  margin-bottom: var(--space-5);
}

.title {
  font-size: 1.625rem;
  font-weight: var(--font-extrabold);
  letter-spacing: -0.025em;
  color: var(--color-text-primary);
  margin-bottom: var(--space-1);
}

.subtitle {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-bottom: var(--space-1);
}

.terms-field {
  margin-top: var(--space-2);
}

.terms-text {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  line-height: var(--leading-relaxed);
}

.terms-link {
  color: var(--color-primary);
  font-weight: var(--font-bold);
  transition: color var(--transition-fast);
  font-size: var(--text-sm);
}

.terms-link:active {
  color: var(--color-primary-dark);
}

.divider {
  position: relative;
  text-align: center;
  margin: var(--space-3) 0;
}

.divider::before,
.divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: calc(50% - 80px);
  height: 1px;
  background: var(--color-border);
}

.divider::before {
  left: 0;
}

.divider::after {
  right: 0;
}

.divider span {
  display: inline-block;
  padding: 0 var(--space-4);
  background: var(--color-bg);
  color: var(--color-text-tertiary);
  font-size: 13px;
}

.social-register {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-bottom: var(--space-2);
}

.social-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-lg);
  font-size: 15px;
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
  background: var(--color-surface);
  transition: var(--press-transition), background var(--transition-fast),
    border-color var(--transition-fast);
  min-height: 46px;
}

.social-button:active {
  transform: scale(var(--press-scale));
  background: var(--color-surface-2);
}

.social-button svg {
  flex-shrink: 0;
}

.register-footer {
  text-align: center;
  margin-top: var(--space-5);
}

.register-footer p {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.link {
  color: var(--color-primary);
  font-weight: var(--font-extrabold);
  transition: color var(--transition-fast);
  font-size: var(--text-sm);
}

.link:active {
  color: var(--color-primary-dark);
}

@media (min-width: 768px) {
  .register-view {
    align-items: center;
    justify-content: center;
  }

  .register-container {
    max-width: 440px;
  }

  .back-button {
    top: var(--space-6);
    left: var(--space-6);
  }

  .register-header {
    padding-top: var(--space-4);
  }
}
</style>
