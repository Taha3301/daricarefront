import { createApp } from 'vue'
import App from './App.vue'

// Service Worker Registration for PWA & Notifications
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        const swPath = `${import.meta.env.BASE_URL}sw.js`
        navigator.serviceWorker.register(swPath)
            .then(reg => console.log('✅ Service Worker registered', reg))
            .catch(err => console.error('❌ Service Worker registration failed', err))
    })
}

createApp(App).mount('#app')
