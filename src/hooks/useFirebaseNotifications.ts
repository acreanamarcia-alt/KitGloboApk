import { useState, useEffect, useCallback } from 'react';
import { requestFCMToken, triggerPushNotification } from '../lib/firebase';

export interface UseFirebaseNotificationsReturn {
  fcmToken: string | null;
  permission: NotificationPermission | 'unsupported';
  requestPermission: () => Promise<string | null>;
  sendLocalTestNotification: (title?: string, body?: string) => void;
  notifyOrderStatusChange: (numeroPedido: number, status: string, alunoNome?: string) => void;
}

export function useFirebaseNotifications(): UseFirebaseNotificationsReturn {
  const [fcmToken, setFcmToken] = useState<string | null>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('kitglobo_fcm_token') : null;
  });

  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  });

  const requestPermission = useCallback(async (): Promise<string | null> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported');
      return null;
    }

    try {
      const token = await requestFCMToken();
      setFcmToken(token);
      setPermission(Notification.permission);
      return token;
    } catch (e) {
      console.error('Erro ao solicitar permissão de notificações:', e);
      return null;
    }
  }, []);

  const sendLocalTestNotification = useCallback(
    (
      title = 'Papelaria Globo - kitGlobo 2027',
      body = 'Notificação Push FCM ativada com sucesso! Você receberá alertas do seu pedido.'
    ) => {
      triggerPushNotification(title, body);
    },
    []
  );

  const notifyOrderStatusChange = useCallback(
    (numeroPedido: number, status: string, alunoNome?: string) => {
      if (status === 'pronto_retirada') {
        const title = `📦 Pedido #${numeroPedido} PRONTO PARA RETIRADA!`;
        const body = alunoNome
          ? `O kit do aluno(a) ${alunoNome} está lacrado e pronto para retirada no Balcão Centro (Av. Brasil, 452).`
          : `Seu kit escolar está lacrado e disponível para retirada na Papelaria Globo Centro.`;
        triggerPushNotification(title, body);
      } else if (status === 'finalizado') {
        triggerPushNotification(
          `✅ Pedido #${numeroPedido} Finalizado!`,
          'Agradecemos a preferência! Desejamos um excelente Ano Letivo 2027.'
        );
      }
    },
    []
  );

  return {
    fcmToken,
    permission,
    requestPermission,
    sendLocalTestNotification,
    notifyOrderStatusChange,
  };
}
