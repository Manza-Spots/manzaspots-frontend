import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './core/router'
import { initializeCapacitor } from './core/capacitor'
import './styles/main.css'

import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/space-grotesk/500.css'
import '@fontsource/space-grotesk/700.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

initializeCapacitor().then(() => {
  app.mount('#app')
})
