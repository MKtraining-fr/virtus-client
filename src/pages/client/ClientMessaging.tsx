import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDataStore } from '../../stores/useDataStore';
import { Message } from '../../types';
import Input from '../../components/Input';
import { supabase } from '../../services/supabase';

// Icônes
const PaperAirplaneIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
    />
  </svg>
);

const PlayIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path
      fillRule="evenodd"
      d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
      clipRule="evenodd"
    />
  </svg>
);

const PauseIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path
      fillRule="evenodd"
      d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z"
      clipRule="evenodd"
    />
  </svg>
);

const DocumentIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
    />
  </svg>
);

// Composant pour le lecteur audio des messages vocaux
const VoiceMessagePlayer: React.FC<{ url: string; duration?: number; isMe: boolean }> = ({
  url,
  duration,
  isMe,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Extraire le chemin du fichier depuis l'URL (pour régénérer l'URL signée)
  const getFilePath = (fullUrl: string): string | null => {
    try {
      // L'URL peut être une URL signée ou une URL publique
      // Format: .../voice-messages/clientId/filename.webm?token=...
      const match = fullUrl.match(/voice-messages\/([^?]+)/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  };

  const loadAudio = async () => {
    setIsLoading(true);
    try {
      const filePath = getFilePath(url);
      if (filePath) {
        // Régénérer une URL signée fraîche
        const { data, error } = await supabase.storage
          .from('voice-messages')
          .createSignedUrl(filePath, 3600);

        if (!error && data?.signedUrl) {
          setAudioUrl(data.signedUrl);
          return data.signedUrl;
        }
      }
      // Fallback: utiliser l'URL d'origine
      setAudioUrl(url);
      return url;
    } catch (error) {
      console.error("Erreur lors du chargement de l'audio:", error);
      setAudioUrl(url);
      return url;
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlay = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // Charger l'audio si pas encore fait
      if (!audioUrl) {
        const newUrl = await loadAudio();
        if (audioRef.current) {
          audioRef.current.src = newUrl;
        }
      }
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Erreur de lecture:', error);
        // Essayer de recharger l'URL
        const newUrl = await loadAudio();
        if (audioRef.current) {
          audioRef.current.src = newUrl;
          await audioRef.current.play();
          setIsPlaying(true);
        }
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex items-center space-x-2 ${isMe ? 'text-white' : 'text-gray-700 dark:text-client-light'}`}>
      <audio
        ref={audioRef}
        src={audioUrl || undefined}
        onTimeUpdate={(e) => setCurrentTime((e.target as HTMLAudioElement).currentTime)}
        onEnded={() => setIsPlaying(false)}
        onError={() => {
          // Si erreur de lecture, essayer de recharger
          if (audioUrl) {
            loadAudio();
          }
        }}
      />
      <button
        onClick={togglePlay}
        disabled={isLoading}
        className={`p-2 rounded-full ${
          isMe ? 'bg-violet-600 hover:bg-violet-700' : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500'
        } ${isLoading ? 'opacity-50' : ''}`}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : isPlaying ? (
          <PauseIcon className="w-4 h-4" />
        ) : (
          <PlayIcon className="w-4 h-4" />
        )}
      </button>
      <div className="flex-1 min-w-[80px]">
        <div className={`h-1 rounded-full ${isMe ? 'bg-violet-400' : 'bg-gray-300 dark:bg-gray-500'}`}>
          <div
            className={`h-full rounded-full ${isMe ? 'bg-white' : 'bg-primary'}`}
            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>
      </div>
      <span className="text-xs whitespace-nowrap">
        {formatTime(currentTime)} / {formatTime(duration || 0)}
      </span>
    </div>
  );
};

// Composant pour l'affichage d'une pièce jointe
const AttachmentDisplay: React.FC<{ message: Message; isMe: boolean }> = ({ message, isMe }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!message.attachmentUrl) return null;

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // Extraire le chemin du fichier depuis l'URL
      const filePath = message.attachmentUrl!.replace(/^.*client-documents\//, '').split('?')[0];
      
      // Créer une URL signée pour le téléchargement
      const { data, error } = await supabase.storage
        .from('client-documents')
        .createSignedUrl(filePath, 3600);

      if (error) throw error;

      window.open(data.signedUrl, '_blank');
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      // Fallback: essayer d'ouvrir directement l'URL
      window.open(message.attachmentUrl, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isDownloading}
      className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer w-full text-left ${
        isMe
          ? 'bg-violet-600 hover:bg-violet-700'
          : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500'
      } ${isDownloading ? 'opacity-50' : ''}`}
    >
      {isDownloading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <DocumentIcon className="w-5 h-5 flex-shrink-0" />
      )}
      <span className="text-sm truncate max-w-[200px]">{message.attachmentName || 'Document'}</span>
    </button>
  );
};

const ClientMessaging: React.FC = () => {
  const { user, clients, messages, setMessages, addMessage, markMessageAsRead } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const coach = useMemo(() => {
    if (!user || !user.coachId) return null;
    return clients.find((c) => c.id === user.coachId);
  }, [user, clients]);

  const conversation = useMemo(() => {
    if (!user || !coach) return [];
    return messages
      .filter(
        (m) =>
          (m.senderId === user.id && m.recipientId === coach.id) ||
          (m.senderId === coach.id && m.recipientId === user.id)
      )
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [messages, user, coach]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView();
  }, [conversation]);

  useEffect(() => {
    if (user && coach) {
      // Marquer les messages non lus comme lus
      const unreadMessages = messages.filter(
        (m) => m.senderId === coach.id && m.recipientId === user.id && !m.isRead && !m.readAt
      );

      unreadMessages.forEach(async (msg) => {
        try {
          await markMessageAsRead(msg.id);
        } catch (error) {
          console.error('Erreur lors du marquage du message comme lu:', error);
        }
      });
    }
  }, [user, coach, messages, markMessageAsRead]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !coach) return;

    try {
      await addMessage({
        senderId: user.id,
        recipientId: coach.id,
        content: newMessage.trim(),
        messageType: 'text',
        isRead: false,
        isVoice: false,
        seenBySender: true,
        seenByRecipient: false,
      });

      // Envoyer une notification au coach
      const { addNotification } = useDataStore.getState();
      await addNotification({
        userId: coach.id,
        title: 'Nouveau message',
        message: `${user.firstName} ${user.lastName} vous a envoyé un message`,
        type: 'message',
        fromName: `${user.firstName} ${user.lastName}`,
        link: `/app/messagerie?clientId=${user.id}`,
      });

      setNewMessage('');
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error);
      alert("Erreur lors de l'envoi du message. Veuillez réessayer.");
    }
  };

  // Rendu d'un message
  const renderMessage = (msg: Message) => {
    const isMe = msg.senderId === user?.id;

    return (
      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
        <div
          className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
            isMe
              ? 'bg-primary text-white rounded-br-none'
              : 'bg-white border dark:border-transparent dark:bg-gray-700 text-gray-800 dark:text-client-light rounded-bl-none'
          }`}
        >
          {/* Contenu selon le type de message */}
          {msg.messageType === 'voice' && msg.voiceUrl ? (
            <VoiceMessagePlayer url={msg.voiceUrl} duration={msg.voiceDuration} isMe={isMe} />
          ) : msg.messageType === 'document' && msg.attachmentUrl ? (
            <>
              <AttachmentDisplay message={msg} isMe={isMe} />
              {msg.content && !msg.content.startsWith('📎') && (
                <p className="mt-2 text-sm">{msg.content}</p>
              )}
            </>
          ) : (
            <p className="text-sm">{msg.content || msg.text}</p>
          )}

          {/* Horodatage */}
          <p
            className={`text-xs mt-1 text-right ${
              isMe ? 'text-violet-200' : 'text-gray-500 dark:text-client-subtle'
            }`}
          >
            {new Date(msg.timestamp).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>
    );
  };

  if (!user) return null;

  if (!coach) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center p-4">
        <p className="dark:text-client-light text-gray-800">Vous n'êtes assigné à aucun coach.</p>
        <p className="dark:text-client-subtle text-gray-500 text-sm mt-1">
          Vous ne pouvez pas utiliser la messagerie pour le moment.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white dark:bg-client-card rounded-lg overflow-hidden">
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-client-dark flex items-center space-x-3 sticky top-0 bg-white dark:bg-client-card z-10">
          <img
            src={coach.avatar || `https://i.pravatar.cc/40?u=${coach.id}`}
            alt={coach.firstName}
            className="w-10 h-10 rounded-full"
          />
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-client-light">
              {coach.firstName} {coach.lastName}
            </h2>
          </div>
        </div>

        <div className="flex-1 p-4 md:p-6 overflow-y-auto bg-gray-50 dark:bg-client-dark">
          <div className="space-y-4">
            {conversation.map(renderMessage)}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="p-2 md:p-4 bg-white dark:bg-client-card border-t border-gray-200 dark:border-client-dark flex items-center space-x-2">
          <Input
            placeholder="Écrire un message..."
            className="flex-1"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <button
            onClick={handleSendMessage}
            className="p-3 rounded-full bg-primary text-white flex-shrink-0"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientMessaging;
