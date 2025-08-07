import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// Styles
import './assets/style.css'
import '@fortawesome/fontawesome-free/css/all.css'

// Create app instance
const app = createApp(App)

// Use plugins
app.use(createPinia())
app.use(router)

// Global properties
app.config.globalProperties.$appName = 'Dashboard Bandara Haluoleo'

// Mount app
app.mount('#app')

console.log('🚀 Haluoleo Dashboard Frontend Started')