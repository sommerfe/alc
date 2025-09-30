import { createApp } from 'vue'
import App from './App.vue'

import 'primeicons/primeicons.css'
import './assets/main.css'

import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'

const app = createApp(App)

app.use(PrimeVue, {
  theme: {
    preset: Aura,
  },
})

app.mount('#app')
