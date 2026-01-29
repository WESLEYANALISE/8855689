// Firebase Messaging Service Worker
// Este arquivo DEVE estar na raiz do public para funcionar corretamente

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Configuração do Firebase - será substituída dinamicamente
const firebaseConfig = {
  apiKey: "AIzaSyAbnRVAQxIawF9xEtz7d4CQ47_B4y9k5v0",
  authDomain: "direito-2a0f6.firebaseapp.com",
  projectId: "direito-2a0f6",
  storageBucket: "direito-2a0f6.firebasestorage.app",
  messagingSenderId: "1075192627119",
  appId: "1:1075192627119:web:faf51b31c3ee00d7a2f95a"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Receber notificações em background
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Mensagem recebida em background:', payload);
  
  const notificationTitle = payload.notification?.title || 'Nova notificação';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/logo.webp',
    badge: '/logo.webp',
    image: payload.notification?.image,
    vibrate: [200, 100, 200],
    tag: 'direito360-notification',
    renotify: true,
    requireInteraction: true,
    data: {
      link: payload.data?.link || '/',
      ...payload.data
    },
    actions: [
      {
        action: 'open',
        title: 'Abrir'
      },
      {
        action: 'close',
        title: 'Fechar'
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Clique na notificação
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notificação clicada:', event);
  
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  const urlToOpen = event.notification.data?.link || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Se já existe uma janela aberta, foca nela
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Se não existe, abre uma nova
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker instalado');
  self.skipWaiting();
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker ativado');
  event.waitUntil(clients.claim());
});
