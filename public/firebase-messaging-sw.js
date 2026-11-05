// firebase-messaging-sw.js - Service Worker da Papelaria Globo (kitGlobo 2027)
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyA_PapelariaGloboDemoKey2027",
  authDomain: "kitglobo-papelariaglobo.firebaseapp.com",
  projectId: "kitglobo-papelariaglobo",
  storageBucket: "kitglobo-papelariaglobo.appspot.com",
  messagingSenderId: "891295754557",
  appId: "1:891295754557:web:9f8a32b17c8d90e21"
};

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Mensagem recebida em segundo plano: ', payload);
    const notificationTitle = payload.notification?.title || 'kitGlobo - Papelaria Globo';
    const notificationOptions = {
      body: payload.notification?.body || 'Seu pedido está pronto para retirada no balcão Centro!',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: payload.data || {}
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (err) {
  console.log('[firebase-messaging-sw.js] Fallback manual push listener ativo');
}

// Interceptador padrão de push nativo
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'Papelaria Globo', body: event.data ? event.data.text() : 'Seu pedido está pronto!' };
  }

  const title = data.title || 'kitGlobo 2027 - Papelaria Globo';
  const options = {
    body: data.body || 'Seu kit escolar está pronto para retirada!',
    icon: '/favicon.ico',
    tag: 'kitglobo-pickup-ready'
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Ação de clique na notificação para focar no app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
