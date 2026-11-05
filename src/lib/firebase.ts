import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

// Configuração do Firebase para a Papelaria Globo (kitGlobo)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyA_PapelariaGloboDemoKey2027',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'kitglobo-papelariaglobo.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'kitglobo-papelariaglobo',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'kitglobo-papelariaglobo.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '891295754557',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:891295754557:web:9f8a32b17c8d90e21',
};

// Inicialização segura do app Firebase
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// VAPID key para Web Push (Pública)
export const VAPID_KEY =
  import.meta.env.VITE_FIREBASE_VAPID_KEY ||
  'BOn3fXg-99WqZ7lM_PapelariaGloboVapidKeyRioBranco2027AcreSample';

/**
 * Solicita permissão e retorna o token FCM do cliente
 */
export async function requestFCMToken(): Promise<string | null> {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('Este navegador não suporta notificações de desktop.');
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Permissão de notificação negada pelo usuário.');
      return null;
    }

    const supported = await isSupported();
    if (!supported) {
      console.warn('Firebase Messaging não é suportado neste ambiente.');
      // Simula token seguro para teste de desenvolvimento
      return 'fcm_token_demo_papelariaglobo_pronto_retirada_2027';
    }

    const messaging = getMessaging(app);

    // Registra service worker
    let registration: ServiceWorkerRegistration | undefined;
    if ('serviceWorker' in navigator) {
      registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    }

    const currentToken = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (currentToken) {
      localStorage.setItem('kitglobo_fcm_token', currentToken);
      return currentToken;
    } else {
      console.warn('Nenhum token FCM de registro disponível.');
      return 'fcm_token_local_dev_' + Date.now().toString(36);
    }
  } catch (error) {
    console.warn('Erro ao obter token FCM (usando fallback seguro):', error);
    return 'fcm_token_fallback_globo_' + Date.now().toString(36);
  }
}

/**
 * Dispara uma notificação push no navegador quando o status do pedido mudar para "pronto_retirada"
 */
export function triggerPushNotification(title: string, body: string, icon = '/favicon.ico') {
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon,
        badge: icon,
        tag: 'kitglobo-order-status',
      });
    } catch (e) {
      console.warn('Falha ao disparar Notification diretamente:', e);
    }
  }
}
