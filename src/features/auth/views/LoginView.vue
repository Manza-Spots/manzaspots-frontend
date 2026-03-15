<script setup>
import { ref } from 'vue'
import { useForm } from '@/shared/composables/useForm'
import { useAuth } from '@/features/auth/composables/useAuth'
import Input from '@/shared/components/Input.vue'
import Button from '@/shared/components/ButtonComponent.vue'
import Icon from '@/shared/components/Icon.vue'
import { useValidation } from '@/shared/composables/useValidation'

const { login } = useAuth()
const { validators } = useValidation()

const showPassword = ref(false)

const { values, errors, isSubmitting, setFieldValue, handleBlur, handleSubmit, setErrors } =
  useForm(
    {
      email: '',
      password: '',
      rememberMe: false,
    },
    {
      email: [validators.required(), validators.email()],
      password: [validators.required(), validators.minLength(6)],
    },
    {
      onSubmit: async (formValues) => {
        try {
          await login(
            {
              email: formValues.email,
              password: formValues.password,
            },
            '/ui'
          )
        } catch (error) {
          if (error.fieldErrors) {
            setErrors(error.fieldErrors)
          } else if (error.status === 401) {
            // Error de credenciales
            setErrors({
              email: ' ',
              password: 'Email o contraseña incorrectos',
            })
          }
        }
      },
    }
  )

const togglePassword = () => {
  showPassword.value = !showPassword.value
}
</script>

<template>
  <div class="login-view">
    <div class="login-container">
      <div class="login-header">
        <div class="logo">
          <Icon name="Mountain" :size="48" />
        </div>
        <h1 class="title">Bienvenido</h1>
        <p class="subtitle">Inicia sesión para continuar tu aventura</p>
      </div>

      <form class="login-form" @submit="handleSubmit">
        <Input
          :model-value="values.email"
          type="email"
          label="Email"
          placeholder="tu@email.com"
          icon="Mail"
          autocomplete="email"
          :error="errors.email"
          :disabled="isSubmitting"
          @update:model-value="setFieldValue('email', $event)"
          @blur="handleBlur('email')"
        />

        <Input
          :model-value="values.password"
          :type="showPassword ? 'text' : 'password'"
          label="Contraseña"
          placeholder="••••••••"
          icon="Lock"
          :icon-right="showPassword ? 'EyeOff' : 'Eye'"
          autocomplete="current-password"
          :error="errors.password"
          :disabled="isSubmitting"
          @update:model-value="setFieldValue('password', $event)"
          @blur="handleBlur('password')"
          @icon-click="togglePassword"
        />

        <div class="form-options">
          <label class="remember-me">
            <input
              v-model="values.rememberMe"
              type="checkbox"
              class="checkbox"
              :disabled="isSubmitting"
            />
            <span>Recordarme</span>
          </label>
          <button type="button" class="forgot-password" :disabled="isSubmitting">
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          full-width
          :loading="isSubmitting"
          :disabled="isSubmitting"
        >
          Iniciar Sesión
        </Button>
      </form>

      <div class="divider">
        <span>o continúa con</span>
      </div>

      <div class="social-login">
        <button type="button" class="social-button google" :disabled="isSubmitting">
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
          Google
        </button>

        <button type="button" class="social-button apple" :disabled="isSubmitting">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
            />
          </svg>
          Apple
        </button>
      </div>

      <!-- Footer -->
      <div class="login-footer">
        <p>
          ¿No tienes cuenta?
          <router-link to="/register" class="link"> Regístrate </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-view {
  min-height: 100vh;
  min-height: -webkit-fill-available;
  display: flex;
  flex-direction: column;
  background: white;
  overflow-x: hidden;
  overflow-y: auto;
}

.login-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  max-width: 100%;
  padding: var(--space-8);
  padding-top: calc(var(--safe-area-inset-top) + var(--space-2));
  padding-bottom: calc(var(--safe-area-inset-bottom) + var(--space-6));
  min-height: 100vh;
  min-height: -webkit-fill-available;
}

.login-header {
  text-align: center;
  margin-bottom: var(--space-10);
}

.logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: var(--radius-2xl);
  color: white;
  margin-bottom: var(--space-6);
}

.title {
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-2);
}

.subtitle {
  font-size: var(--text-lg);
  color: var(--color-text-secondary);
  margin: 0;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  margin-bottom: var(--space-1);
}

.form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-top: calc(var(--space-1) * -1);
  flex-wrap: wrap;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.remember-me .checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--color-primary);
}

.forgot-password {
  font-size: var(--text-sm);
  color: var(--color-primary);
  font-weight: var(--font-medium);
  transition: color var(--transition-fast);
  white-space: nowrap;
}

.forgot-password:hover {
  color: var(--color-primary-dark);
  text-decoration: underline;
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
  background: white;
  color: var(--color-text-tertiary);
  font-size: var(--text-sm);
}

.social-login {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-bottom: var(--space-8);
}

.social-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  color: var(--color-text-primary);
  background: white;
  transition: all var(--transition-fast);
  min-height: 52px;
}

.social-button:active {
  transform: scale(0.98);
  background: var(--color-gray-50);
}

.social-button svg {
  flex-shrink: 0;
}

.login-footer {
  text-align: center;
  margin-top: auto;
}

.login-footer p {
  margin: 0;
  font-size: var(--text-base);
  color: var(--color-text-secondary);
}

.link {
  color: var(--color-primary);
  font-weight: var(--font-semibold);
  transition: color var(--transition-fast);
}

.link:active {
  color: var(--color-primary-dark);
}

/* Desktop fallback (opcional) */
@media (min-width: 768px) {
  .login-view {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    align-items: center;
    justify-content: center;
  }

  .login-container {
    max-width: 440px;
    background: white;
    border-radius: var(--radius-2xl);
    padding: var(--space-8);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }
}
</style>
