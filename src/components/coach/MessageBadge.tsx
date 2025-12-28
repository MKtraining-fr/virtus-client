import React from 'react';
import { ChatBubbleLeftIcon } from '../../constants/icons';

interface MessageBadgeProps {
  unreadCount: number;
  onClick: () => void;
  className?: string;
}

/**
 * Composant MessageBadge - Affiche une icône de messagerie avec un badge de compteur
 * Le badge apparaît à gauche de l'icône (conformément aux préférences utilisateur)
 */
const MessageBadge: React.FC<MessageBadgeProps> = ({
  unreadCount,
  onClick,
  className = '',
}) => {
  const hasUnread = unreadCount > 0;

  return (
    <button
      onClick={onClick}
      className={`relative inline-flex items-center justify-center p-2 rounded-full transition-colors ${
        hasUnread
          ? 'bg-primary text-white hover:bg-violet-700'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      } ${className}`}
      aria-label={
        hasUnread
          ? `${unreadCount} message${unreadCount > 1 ? 's' : ''} non lu${unreadCount > 1 ? 's' : ''}`
          : 'Ouvrir la messagerie'
      }
      title={
        hasUnread
          ? `${unreadCount} message${unreadCount > 1 ? 's' : ''} non lu${unreadCount > 1 ? 's' : ''}`
          : 'Ouvrir la messagerie'
      }
    >
      {/* Badge positionné à gauche de l'icône */}
      {hasUnread && (
        <span
          className="absolute -top-1 -left-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold text-white bg-red-500 rounded-full"
          aria-hidden="true"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
      <ChatBubbleLeftIcon className="w-5 h-5" />
    </button>
  );
};

export default MessageBadge;
