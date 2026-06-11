import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './core/router'
import { initializeCapacitor } from './core/capacitor'
import { useAuthStore } from './features/auth/store'
import vue3GoogleLogin from 'vue3-google-login'
import i18n from './core/i18n'

import '@fontsource/manrope/400.css'
import '@fontsource/manrope/500.css'
import '@fontsource/manrope/600.css'
import '@fontsource/manrope/700.css'
import '@fontsource/manrope/800.css'

import './styles/main.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(i18n)
app.use(vue3GoogleLogin, {
  clientId: import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID,
})

async function initApp() {
  try {
    await initializeCapacitor()

    const authStore = useAuthStore()
    await authStore.initialize()

    app.mount('#app')
  } catch (error) {
    console.error('App initialization error:', error)

    app.mount('#app')
  }
}

initApp()
