import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * Hook pour calculer le nombre de messages non lus pour un client spécifique
 * @param clientId - L'ID du client
 * @returns Le nombre de messages non lus envoyés par ce client
 */
export const useUnreadCount = (clientId: string | undefined): number => {
  const { user, messages } = useAuth();

  return useMemo(() => {
    if (!clientId || !user) return 0;

    return messages.filter(
      (msg) =>
        msg.senderId === clientId &&
        msg.recipientId === user.id &&
        !msg.readAt &&
        !msg.isRead
    ).length;
  }, [clientId, user, messages]);
};

/**
 * Hook pour calculer le nombre total de messages non lus pour tous les clients
 * @returns Un objet avec le total et un map par clientId
 */
export const useAllUnreadCounts = (): {
  total: number;
  byClient: Record<string, number>;
} => {
  const { user, messages } = useAuth();

  return useMemo(() => {
    if (!user) return { total: 0, byClient: {} };

    const byClient: Record<string, number> = {};
    let total = 0;

    messages.forEach((msg) => {
      if (
        msg.recipientId === user.id &&
        !msg.readAt &&
        !msg.isRead
      ) {
        const senderId = msg.senderId;
        byClient[senderId] = (byClient[senderId] || 0) + 1;
        total++;
      }
    });

    return { total, byClient };
  }, [user, messages]);
};

export default useUnreadCount;
