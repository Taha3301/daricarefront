import { createApp } from 'vue'
import App from './App.vue'

// Service Worker Registration for PWA & Notifications
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('✅ Service Worker registered', reg))
            .catch(err => console.error('❌ Service Worker registration failed', err))
    })
}

createApp(App).mount('#app')
