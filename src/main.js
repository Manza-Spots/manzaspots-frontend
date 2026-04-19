import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './core/router'
import { initializeCapacitor } from './core/capacitor'
import { useAuthStore } from './features/auth/store'
import vue3GoogleLogin from 'vue3-google-login'

import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/space-grotesk/500.css'
import '@fontsource/space-grotesk/700.css'

import './styles/main.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
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
