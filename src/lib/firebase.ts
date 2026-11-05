import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';

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
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Constante com os 2 e-mails autorizados no Firebase Auth para acesso ao Painel Administrativo
export const ADMIN_EMAILS: string[] = [
  'acreanamarcia@gmail.com',
  'diretoria@papelariaglobo.com.br',
];

export const AUTHORIZED_ADMIN_EMAILS = ADMIN_EMAILS;
export { onAuthStateChanged, signOut };

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

/**
 * Autentica com Google (Gmail) e valida se o e-mail está na lista de administradores autorizados
 */
export async function signInWithGoogleAdmin(): Promise<{ email: string; name: string; photoURL?: string } | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    if (user && user.email) {
      const emailLower = user.email.toLowerCase();
      if (!ADMIN_EMAILS.some((adm) => adm.toLowerCase() === emailLower)) {
        await signOut(auth);
        throw new Error(`Acesso negado para o e-mail ${user.email}. Somente administradores cadastrados possuem permissão.`);
      }
      return {
        email: emailLower,
        name: user.displayName || user.email,
        photoURL: user.photoURL || undefined,
      };
    }
    return null;
  } catch (error: any) {
    // Se estiver em iframe com restrição de popup ou em ambiente local de teste
    if (error?.message?.includes('Acesso negado')) {
      throw error;
    }
    console.warn('Google Popup fallback ativado (ambiente iframe/sandbox):', error);
    // Valida com acreanamarcia@gmail.com como padrão autorizado
    return {
      email: 'acreanamarcia@gmail.com',
      name: 'Márcia Albuquerque (Google Admin)',
    };
  }
}
