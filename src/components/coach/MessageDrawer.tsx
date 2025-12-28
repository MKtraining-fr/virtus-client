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
  MicrophoneIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
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

// Composant pour le lecteur audio des messages vocaux
const VoiceMessagePlayer: React.FC<{ url: string; duration?: number; isMe: boolean }> = ({ url, duration, isMe }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const getFilePath = (fullUrl: string): string | null => {
    try {
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
        const { data, error } = await supabase.storage
          .from('voice-messages')
          .createSignedUrl(filePath, 3600);
        
        if (!error && data?.signedUrl) {
          setAudioUrl(data.signedUrl);
          return data.signedUrl;
        }
      }
      setAudioUrl(url);
      return url;
    } catch (error) {
      console.error('Erreur lors du chargement de l\'audio:', error);
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
    <div className={`flex items-center space-x-2 ${isMe ? 'text-white' : 'text-gray-700'}`}>
      <audio
        ref={audioRef}
        src={audioUrl || undefined}
        onTimeUpdate={(e) => setCurrentTime((e.target as HTMLAudioElement).currentTime)}
        onEnded={() => setIsPlaying(false)}
        onError={() => {
          if (audioUrl) loadAudio();
        }}
      />
      <button
        onClick={togglePlay}
        disabled={isLoading}
        className={`p-2 rounded-full ${isMe ? 'bg-violet-600 hover:bg-violet-700' : 'bg-gray-200 hover:bg-gray-300'} ${isLoading ? 'opacity-50' : ''}`}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : isPlaying ? (
          <PauseIcon className="w-4 h-4" />
        ) : (
          <PlayIcon className="w-4 h-4" />
        )}
      </button>
      <div className="flex-1">
        <div className={`h-1 rounded-full ${isMe ? 'bg-violet-400' : 'bg-gray-300'}`}>
          <div
            className={`h-full rounded-full ${isMe ? 'bg-white' : 'bg-primary'}`}
            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>
      </div>
      <span className="text-xs">
        {formatTime(currentTime)} / {formatTime(duration || 0)}
      </span>
    </div>
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

// Composant pour l'enregistrement vocal
const VoiceRecorder: React.FC<{
  onRecordingComplete: (blob: Blob, duration: number) => void;
  onCancel: () => void;
}> = ({ onRecordingComplete, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const durationRef = useRef(0);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      durationRef.current = 0;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        onRecordingComplete(blob, durationRef.current);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        durationRef.current += 1;
        setDuration(durationRef.current);
      }, 1000);
    } catch (error: any) {
      console.error('[VoiceRecorder] Erreur:', error);
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setPermissionDenied(true);
        alert('Permission microphone refusée. Veuillez autoriser l\'accès au microphone.');
      } else {
        alert('Impossible d\'accéder au microphone.');
      }
      onCancel();
    }
  };

  useEffect(() => {
    startRecording();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    };
  }, []);

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    onCancel();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (permissionDenied) {
    return (
      <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
        <span className="text-red-600 text-sm">Permission refusée</span>
        <div className="flex-1" />
        <Button onClick={onCancel} variant="secondary" size="sm">
          <XMarkIcon className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 p-2 bg-red-50 rounded-lg">
      <div className="flex items-center space-x-2">
        {isRecording && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
        <span className="text-red-600 font-medium text-sm">
          {isRecording ? formatTime(duration) : '...'}
        </span>
      </div>
      <div className="flex-1" />
      {isRecording && (
        <>
          <button
            onClick={stopRecording}
            className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-full"
            title="Envoyer"
          >
            <StopIcon className="w-4 h-4" />
          </button>
          <button
            onClick={cancelRecording}
            className="p-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full"
            title="Annuler"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </>
      )}
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
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
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
    if (isOpen && inputRef.current && !isRecording) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, client?.id, isRecording]);

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
  const handleSendMessage = async (
    messageType: MessageType = 'text',
    content: string = newMessage.trim(),
    attachmentData?: { url: string; name: string; type: string; duration?: number }
  ) => {
    if ((!content && messageType === 'text') || !user || !client) return;

    setIsSending(true);
    try {
      await addMessage({
        senderId: user.id,
        recipientId: client.id,
        content: content || '',
        messageType,
        isVoice: messageType === 'voice',
        voiceUrl: attachmentData?.url,
        voiceDuration: attachmentData?.duration,
        attachmentUrl: messageType === 'document' ? attachmentData?.url : undefined,
        attachmentName: messageType === 'document' ? attachmentData?.name : undefined,
        attachmentType: messageType === 'document' ? attachmentData?.type : undefined,
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

  // Gestion de l'enregistrement vocal
  const handleVoiceRecordingComplete = async (blob: Blob, duration: number) => {
    setIsRecording(false);
    setIsUploading(true);

    try {
      const fileName = `voice_${user?.id}_${Date.now()}.webm`;
      const filePath = `${client?.id}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('voice-messages')
        .upload(filePath, blob, {
          contentType: 'audio/webm',
        });

      if (error) throw error;

      const { data: urlData, error: urlError } = await supabase.storage
        .from('voice-messages')
        .createSignedUrl(filePath, 3600);

      if (urlError || !urlData?.signedUrl) {
        throw new Error('Impossible de générer l\'URL du message vocal');
      }

      await handleSendMessage('voice', '🎤 Message vocal', {
        url: urlData.signedUrl,
        name: fileName,
        type: 'audio/webm',
        duration,
      });
    } catch (error) {
      console.error('Erreur lors de l\'upload du vocal:', error);
      alert('Erreur lors de l\'envoi du message vocal.');
    } finally {
      setIsUploading(false);
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
            <VoiceMessagePlayer
              url={msg.voiceUrl}
              duration={msg.voiceDuration}
              isMe={isMe}
            />
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
    <>
      {/* Drawer - positionné à droite avec z-index inférieur aux modales */}
      <div
        className="fixed top-0 right-0 z-30 w-full max-w-sm bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out border-l border-gray-200"
        style={{ height: '100vh' }}
        role="complementary"
        aria-labelledby="drawer-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-white">
          <div className="flex items-center space-x-3">
            {client && (
              <>
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-semibold text-sm">
                  {client.firstName.charAt(0)}{client.lastName.charAt(0)}
                </div>
                <div>
                  <h2
                    id="drawer-title"
                    className="text-base font-semibold text-gray-900"
                  >
                    {client.firstName} {client.lastName}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {conversation.length} message{conversation.length > 1 ? 's' : ''}
                  </p>
                </div>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Fermer le panneau de messagerie"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Zone de messages */}
        <div className="flex-1 overflow-y-auto p-3 bg-gray-50">
          {client ? (
            conversation.length > 0 ? (
              <div className="space-y-2">
                {conversation.map(renderMessage)}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                <p>Aucun message. Commencez la conversation !</p>
              </div>
            )
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              <p>Sélectionnez un client pour voir la conversation.</p>
            </div>
          )}
        </div>

        {/* Zone de saisie */}
        {client && (
          <div className="p-3 bg-white border-t border-gray-200">
            {isRecording ? (
              <VoiceRecorder
                onRecordingComplete={handleVoiceRecordingComplete}
                onCancel={() => setIsRecording(false)}
              />
            ) : isUploading ? (
              <div className="flex items-center justify-center p-2 text-gray-500 text-sm">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                Envoi en cours...
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsRecording(true)}
                  className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-full transition-colors"
                  title="Enregistrer un message vocal"
                  aria-label="Enregistrer un message vocal"
                >
                  <MicrophoneIcon className="w-5 h-5" />
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Écrire un message..."
                  className="flex-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-gray-900 placeholder:text-gray-500"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isSending}
                  aria-label="Message à envoyer"
                />
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={isSending || !newMessage.trim()}
                  aria-label="Envoyer le message"
                  size="sm"
                >
                  <PaperAirplaneIcon className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </>,
    container
  );
};

export default MessageDrawer;
