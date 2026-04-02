<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Icon from '@/shared/components/Icon.vue'
import Input from '@/shared/components/InputComponent.vue'
import Button from '@/shared/components/ButtonComponent.vue'
import { useForm } from '@/shared/composables/useForm'
import { useValidation } from '@/shared/composables/useValidation'
import { useAuth } from '@/features/auth/composables/useAuth'

const router = useRouter()
const { requestPasswordReset } = useAuth()
const { validators } = useValidation()
const emailSent = ref(false)

const { values, errors, isSubmitting, setFieldValue, handleBlur, handleSubmit, setErrors } =
  useForm(
    {
      email: '',
    },
    {
      email: [validators.required(), validators.email()],
    },
    {
      onSubmit: async (formValues) => {
        try {
          await requestPasswordReset(formValues.email)
          emailSent.value = true
        } catch (error) {
          if (error.fieldErrors) {
            setErrors(error.fieldErrors)
          }
        }
      },
    }
  )
const goToLogin = () => router.push('/login')
</script>

<template>
  <div class="forgot-password-view">
    <button class="back-button" @click="goToLogin()">
      <Icon name="ArrowLeft"/>
    </button>
    <div class="forgot-container">
      <template v-if="!emailSent">
        <div class="forgot-header">
          <h1 class="title">Recuperar contraseña</h1>
          <p class="subtitle">Ingresa tu correo electrónico asociado y te enviaremos las instrucciones</p>
        </div>

        <form class="forgot-form" @submit="handleSubmit">
          <Input
            :model-value="values.email"
            type="email"
            label="Email"
            placeholder="ejemplo@email.com"
            icon="Mail"
            autocomplete="email"
            :error="errors.email"
            :disabled="isSubmitting"
            @update:model-value="setFieldValue('email', $event)"
            @blur="handleBlur('email')"
          />

          <Button
            type="submit"
            variant="primary"
            full-width
            :loading="isSubmitting"
            :disabled="isSubmitting"
            class="submit-button"
          >
            Enviar instrucciones de recuperación
          </Button>
        </form>
      </template>

      <template v-else>
        <div class="success-header">
          <div class="icon-circle">
            <Icon name="Mail" size="32" class="success-icon" />
          </div>
          <h1 class="title">¡Correo enviado!</h1>
          <p class="subtitle">
            Si <strong>{{ values.email }}</strong> está en nuestro sistema, en breve recibirás un enlace para crear una nueva contraseña. Por favor, revisa también tu carpeta de spam.
          </p>
          <Button
            variant="outline"
            full-width
            class="back-login-btn"
            @click="router.push('/login')"
          >
            Volver al inicio de sesión
          </Button>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.forgot-password-view {
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

.forgot-container {
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

.forgot-header {
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

.forgot-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
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
  .forgot-password-view {
    align-items: center;
    justify-content: center;
  }

  .forgot-container {
    max-width: 440px;
  }
}
</style>