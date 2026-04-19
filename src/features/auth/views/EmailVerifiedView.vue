<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Icon from '@/shared/components/Icon.vue'
import Button from '@/shared/components/ButtonComponent.vue'
import { useAuth } from '@/features/auth/composables/useAuth'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const route = useRoute()
const { verifyEmail, resendVerificationEmail, registrationEmail } = useAuth()
const { t } = useI18n()

const verificationStatus = ref('idle')
const errorMessage = ref('')
const isResending = ref(false)

onMounted(async () => {
  const token = route.query.token
  if (token) {
    router.replace({ path: route.path, query: {} })
    
    verificationStatus.value = 'loading'
    try {
      await verifyEmail(token)
      verificationStatus.value = 'success'
    } catch (error) {
      verificationStatus.value = 'error'
      errorMessage.value = error.message || t('auth.verify.error.subtitle')
    }
  } else {
    verificationStatus.value = 'idle'
  }
})

const handleResend = async () => {
  isResending.value = true
  try {
    await resendVerificationEmail()
  } catch (error) {
    verificationStatus.value = 'error'
    errorMessage.value = error.message || t('auth.verify.error.subtitle')
  } finally {
    isResending.value = false
  }
}

const goToLogin = () => router.push('/login')
</script>

<template>
  <div class="email-verified-view">
    <div class="verified-container">
      <div v-if="verificationStatus === 'loading'" class="state-container">
         <h1 class="title">{{ $t('auth.verify.loading.title') }}</h1>
         <p class="subtitle">{{ $t('auth.verify.loading.subtitle') }}</p>
      </div>
      <div v-else-if="verificationStatus === 'success'" class="state-container">
        <div class="icon-circle success">
          <Icon name="CheckCircle" size="48" class="icon-svg" />
        </div>
        <h1 class="title">{{ $t('auth.verify.success.title') }}</h1>
        <p class="subtitle">
          {{ $t('auth.verify.success.subtitle') }}
        </p>
        <Button variant="primary" full-width class="action-btn" @click="goToLogin">
          {{ $t('auth.verify.backToLogin') }}
        </Button>
      </div>
      <div v-else-if="verificationStatus === 'error'" class="state-container">
        <div class="icon-circle error">
          <Icon name="AlertCircle" size="48" class="icon-svg" />
        </div>
        <h1 class="title">{{ $t('auth.verify.error.title') }}</h1>
        <p class="subtitle text-error">{{ errorMessage }}</p>
        
        <p class="info-text">
          {{ $t('auth.verify.error.info') }}
        </p>

        <Button 
          variant="primary" 
          full-width 
          class="action-btn"
          :loading="isResending" 
          :disabled="isResending"
          @click="handleResend"
        >
          {{ $t('auth.verify.resend') }}
        </Button>
        <Button variant="outline" full-width class="action-btn-secondary" @click="goToLogin">
          {{ $t('auth.verify.backToLogin') }}
        </Button>
      </div>

      <div v-else class="state-container">
        <div class="icon-circle info">
          <Icon name="Mail" size="48" class="icon-svg" />
        </div>
        <h1 class="title">{{ $t('auth.verify.idle.title') }}</h1>
        <p class="subtitle">
          {{ $t('auth.verify.idle.subtitle', { email: registrationEmail || $t('auth.verify.idle.noEmail') }) }}
        </p>
        <p class="info-text">
          {{ $t('auth.verify.idle.info') }}
        </p>
        <Button 
          variant="primary" 
          full-width 
          class="action-btn"
          :loading="isResending" 
          :disabled="isResending"
          @click="handleResend"
        >
          {{ $t('auth.verify.resend') }}
        </Button>
        <Button variant="outline" full-width class="action-btn-secondary" @click="goToLogin">
          {{ $t('auth.verify.backToLogin') }}
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.email-verified-view {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-primary, var(--color-bg));
}

.verified-container {
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

.state-container {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.icon-circle {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-6);
}

.icon-circle.success, .icon-circle.info {
  background-color: var(--color-success-light, rgba(52, 168, 83, 0.1));
  color: var(--color-success, #34A853);
}

.icon-circle.error {
  background-color: var(--color-error-light, rgba(234, 67, 53, 0.1));
  color: var(--color-error, #EA4335);
}

.title {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-3);
}

.subtitle {
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  line-height: var(--leading-relaxed);
  margin: 0;
  margin-bottom: var(--space-4);
}

.text-error {
  color: var(--color-error, #EA4335);
  font-weight: var(--font-medium);
}

.info-text {
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
  margin-bottom: var(--space-6);
}

.action-btn {
  margin-top: var(--space-2);
}

.action-btn-secondary {
  margin-top: var(--space-3);
}

@media (min-width: 768px) {
  .email-verified-view {
    align-items: center;
    justify-content: center;
  }

  .verified-container {
    max-width: 440px;
  }
}
</style>
