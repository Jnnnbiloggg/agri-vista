// src/main.ts

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import vuetify from './plugins/vuetify'

import App from './App.vue'
import router from './router'
import { useAuth } from './composables/useAuth'

// Import global styles
import './styles/global.css'
import './styles/design-system.css'

const app = createApp(App)

const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(vuetify)

// Initialize authentication
const { initializeAuth, setupAuthListener } = useAuth()
initializeAuth().then(() => {
  setupAuthListener()
  app.mount('#app')
})
