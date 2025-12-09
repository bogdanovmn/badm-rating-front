import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { SsoService } from '@bogdanovmn/ssofw'


createApp(App)
    .use(createPinia())
    .use(router)
    .provide('ssoService', new SsoService(import.meta.env.VITE_SSO_SERVICE_URL))
    .mount('#app')
