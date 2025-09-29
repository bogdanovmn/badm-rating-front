import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { SsoService } from '@bogdanovmn/ssofw'


const app = createApp(App)
const ssoService = new SsoService(import.meta.env.VITE_SSO_SERVICE_URL)

app.use(createPinia())
app.use(router)
app.provide('ssoService', ssoService)

app.mount('#app')
