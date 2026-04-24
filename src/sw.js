import { precacheAndRoute } from 'workbox-precaching';

// Precache the assets injected by VitePWA
precacheAndRoute(self.__WB_MANIFEST || []);

// Listen for push events
self.addEventListener('push', function(event) {
  let pushData = {};
  if (event.data) {
    pushData = event.data.json();
  } else {
    pushData = {
      title: 'إشعار جديد',
      body: 'لديك رسالة جديدة على المنصة',
      icon: '/favicon.svg'
    };
  }

  const options = {
    body: pushData.body || 'لديك رسالة جديدة',
    icon: pushData.icon || '/favicon.svg',
    badge: '/favicon.svg',
    data: pushData.data || { url: '/' },
  };

  event.waitUntil(
    self.registration.showNotification(pushData.title || 'Hello Staff', options)
  );
});

// Listen for notification click
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const urlToOpen = new URL(event.notification.data?.url || '/', self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
