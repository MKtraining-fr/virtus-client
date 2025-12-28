import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Message, MessageType, Client } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import Button from '../Button';
import {
  XMarkIcon,
  PaperAirplaneIcon,
  CheckIcon,
  DocumentIcon,
} from '../../constants/icons';

// Composant pour afficher l'indicateur de lecture (double check)
const ReadIndicator: React.FC<{ message: Message }> = ({ message }) => {
  const isRead = message.readAt || message.seenByRecipient;

  return (
    <span className="inline-flex ml-1">
      {isRead ? (
        <span className="text-blue-300 flex">
          <CheckIcon className="w-3 h-3" />
          <CheckIcon className="w-3 h-3 -ml-1.5" />
        </span>
      ) : (
        <span className="text-gray-300">
          <CheckIcon className="w-3 h-3" />
        </span>
      )}
    </span>
  );
};

// Composant pour l'affichage d'une pièce jointe
const AttachmentDisplay: React.FC<{ message: Message; isMe: boolean }> = ({
  message,
  isMe,
}) => {
  if (!message.attachmentUrl) return null;

  const handleDownload = async () => {
    try {
      const { data, error } = await supabase.storage
        .from('client-documents')
        .createSignedUrl(
          message.attachmentUrl!.replace(/^.*client-documents\//, ''),
          3600
        );

      if (error) throw error;

      window.open(data.signedUrl, '_blank');
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      window.open(message.attachmentUrl, '_blank');
    }
  };

  return (
    <div
      onClick={handleDownload}
      className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer ${
        isMe
          ? 'bg-violet-600 hover:bg-violet-700'
          : 'bg-gray-100 hover:bg-gray-200'
      }`}
    >
      <DocumentIcon className="w-5 h-5" />
      <span className="text-sm truncate max-w-[200px]">
        {message.attachmentName || 'Document'}
      </span>
    </div>
  );
};

interface MessageDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onClientChange?: (clientId: string) => void;
}

const MessageDrawer: React.FC<MessageDrawerProps> = ({
  isOpen,
  onClose,
  client,
  onClientChange,
}) => {
  const { user, messages, addMessage, markMessageAsRead } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [container, setContainer] = useState<HTMLElement | null>(null);

  // Initialiser le container pour le portal
  useEffect(() => {
    const modalRoot = document.getElementById('modal-root');
    setContainer(modalRoot);
  }, []);

  // Scroll vers le bas quand les messages changent
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, client?.id, isOpen]);

  // Focus sur l'input à l'ouverture
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, client?.id]);

  // Marquer les messages comme lus à l'ouverture
  useEffect(() => {
    if (isOpen && user && client) {
      const unreadMessages = messages.filter(
        (m) =>
          m.senderId === client.id &&
          m.recipientId === user.id &&
          !m.readAt &&
          !m.isRead
      );

      unreadMessages.forEach(async (msg) => {
        try {
          await markMessageAsRead(msg.id);
        } catch (error) {
          console.error('Erreur lors du marquage du message comme lu:', error);
        }
      });
    }
  }, [isOpen, user, client, messages, markMessageAsRead]);

  // Filtrer les messages de la conversation
  const conversation = useMemo(() => {
    if (!client || !user) return [];
    return messages
      .filter(
        (m) =>
          (m.senderId === user.id && m.recipientId === client.id) ||
          (m.senderId === client.id && m.recipientId === user.id)
      )
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
  }, [client, messages, user]);

  // Envoyer un message
  const handleSendMessage = async () => {
    const content = newMessage.trim();
    if (!content || !user || !client) return;

    setIsSending(true);
    try {
      await addMessage({
        senderId: user.id,
        recipientId: client.id,
        content,
        messageType: 'text' as MessageType,
        isVoice: false,
        isRead: false,
        seenBySender: true,
        seenByRecipient: false,
      });
      setNewMessage('');
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error);
      alert("Erreur lors de l'envoi du message. Veuillez réessayer.");
    } finally {
      setIsSending(false);
    }
  };

  // Gestion du clavier
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  // Rendu d'un message
  const renderMessage = (msg: Message) => {
    const isMe = msg.senderId === user?.id;

    return (
      <div
        key={msg.id}
        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
      >
        <div
          className={`max-w-[85%] px-3 py-2 rounded-xl ${
            isMe ? 'bg-primary text-white' : 'bg-white border border-gray-200'
          }`}
        >
          {/* Contenu selon le type de message */}
          {msg.messageType === 'voice' && msg.voiceUrl ? (
            <div className="flex items-center space-x-2">
              <span>🎤</span>
              <span className="text-sm">Message vocal</span>
            </div>
          ) : msg.messageType === 'document' && msg.attachmentUrl ? (
            <>
              <AttachmentDisplay message={msg} isMe={isMe} />
              {msg.content && !msg.content.startsWith('📎') && (
                <p className="mt-2 text-sm">{msg.content}</p>
              )}
            </>
          ) : (
            <p className="text-sm whitespace-pre-wrap">{msg.content || msg.text}</p>
          )}

          {/* Horodatage et indicateur de lecture */}
          <div
            className={`flex items-center justify-end mt-1 ${
              isMe ? 'text-violet-200' : 'text-gray-400'
            }`}
          >
            <span className="text-xs">
              {new Date(msg.timestamp).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            {isMe && <ReadIndicator message={msg} />}
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen || !container) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-40 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
    >
      {/* Overlay semi-transparent (optionnel - cliquer pour fermer) */}
      <div
        className="absolute inset-0 bg-black bg-opacity-25 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className="relative w-full max-w-md bg-white shadow-xl flex flex-col transform transition-transform duration-300 ease-in-out"
        style={{ height: '100vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center space-x-3">
            {client && (
              <>
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
                  {client.firstName.charAt(0)}{client.lastName.charAt(0)}
                </div>
                <div>
                  <h2
                    id="drawer-title"
                    className="text-lg font-semibold text-gray-900"
                  >
                    {client.firstName} {client.lastName}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {conversation.length} message
                    {conversation.length > 1 ? 's' : ''}
                  </p>
                </div>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Fermer le panneau de messagerie"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Zone de messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {client ? (
            conversation.length > 0 ? (
              <div className="space-y-3">
                {conversation.map(renderMessage)}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p>Aucun message. Commencez la conversation !</p>
              </div>
            )
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>Sélectionnez un client pour voir la conversation.</p>
            </div>
          )}
        </div>

        {/* Zone de saisie */}
        {client && (
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <input
                ref={inputRef}
                type="text"
                placeholder="Écrire un message..."
                className="flex-1 w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-gray-900 placeholder:text-gray-500"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSending}
                aria-label="Message à envoyer"
              />
              <Button
                onClick={handleSendMessage}
                disabled={isSending || !newMessage.trim()}
                aria-label="Envoyer le message"
              >
                <PaperAirplaneIcon className="w-5 h-5" />
              </Button>
            </div>
            <p className="mt-2 text-xs text-gray-400 text-center">
              Appuyez sur Entrée pour envoyer • Échap pour fermer
            </p>
          </div>
        )}
      </div>
    </div>,
    container
  );
};

export default MessageDrawer;
