// Service Worker for Daricare Notifications
self.addEventListener('push', function (event) {
    console.log('System Push received:', event);
    let data = {};
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data = { body: event.data.text() };
        }
    }

    const title = data.title || 'Daricare - Nouvelle Demande';
    const options = {
        body: data.body || 'Une nouvelle demande de soin est disponible dans votre zone.',
        icon: '/favicon.png',
        badge: '/favicon.png',
        vibrate: [200, 100, 200],
        data: data.url || '/',
        tag: data.id || 'new-booking',
        actions: [
            { action: 'view', title: '👀 Voir les détails' },
            { action: 'close', title: 'Fermer' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    const urlToOpen = event.notification.data || '/';

    // Handle specific actions if clicked
    if (event.action === 'accept') {
        event.waitUntil(clients.openWindow(urlToOpen + '?action=accept&id=' + event.notification.tag));
        return;
    } else if (event.action === 'decline') {
        event.waitUntil(clients.openWindow(urlToOpen + '?action=deny&id=' + event.notification.tag));
        return;
    }

    // Default click behavior: Focus existing window or open new one
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(function (windowClients) {
                for (let i = 0; i < windowClients.length; i++) {
                    const client = windowClients[i];
                    if (client.url.includes(urlToOpen) && 'focus' in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

// Basic caching to satisfy PWA requirements
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});
// Listen for messages from the main app to show notifications
// This is more reliable for background execution on some mobile browsers
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
        const { title, options } = event.data;
        event.waitUntil(
            self.registration.showNotification(title, options)
        );
    }
});
