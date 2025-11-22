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
// Initialize authentication and mount app immediately
const { initializeAuth, setupAuthListener } = useAuth()

// Mount app immediately so public pages render without waiting for auth
app.mount('#app')

// Set up auth listener right away to handle auth changes
setupAuthListener()

// Initialize auth in background (don't block mounting)
initializeAuth().catch((err) => {
  console.error('Auth init failed:', err)
})
