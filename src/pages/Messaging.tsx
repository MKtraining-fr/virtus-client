import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Message, MessageType } from '../types';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Select from '../components/Select';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { getUserAvatarUrl } from '../utils/avatarUtils';
import { 
  PaperAirplaneIcon, 
  PlusIcon, 
  MicrophoneIcon, 
  PaperClipIcon,
  CheckIcon,
  DocumentIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  XMarkIcon
} from '../constants/icons';

// Composant pour afficher l'indicateur de lecture (double check)
const ReadIndicator: React.FC<{ message: Message; isCoach: boolean }> = ({ message, isCoach }) => {
  // Seul le coach voit l'indicateur de lecture sur ses propres messages
  if (!isCoach) return null;
  
  const isRead = message.readAt || message.seenByRecipient;
  
  return (
    <span className="inline-flex ml-1">
      {isRead ? (
        // Double check bleu = lu
        <span className="text-blue-300 flex">
          <CheckIcon className="w-3 h-3" />
          <CheckIcon className="w-3 h-3 -ml-1.5" />
        </span>
      ) : (
        // Simple check gris = envoyé mais non lu
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
    <div className={`flex items-center space-x-2 ${isMe ? 'text-white' : 'text-gray-700'}`}>
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
const AttachmentDisplay: React.FC<{ message: Message; isMe: boolean }> = ({ message, isMe }) => {
  if (!message.attachmentUrl) return null;

  const handleDownload = async () => {
    try {
      // Créer une URL signée pour le téléchargement
      const { data, error } = await supabase.storage
        .from('client-documents')
        .createSignedUrl(message.attachmentUrl!.replace(/^.*client-documents\//, ''), 3600);
      
      if (error) throw error;
      
      window.open(data.signedUrl, '_blank');
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      // Fallback: essayer d'ouvrir directement l'URL
      window.open(message.attachmentUrl, '_blank');
    }
  };

  return (
    <div
      onClick={handleDownload}
      className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer ${
        isMe ? 'bg-violet-600 hover:bg-violet-700' : 'bg-gray-100 hover:bg-gray-200'
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
      console.log('[VoiceRecorder] Demande d\'accès au microphone...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('[VoiceRecorder] Accès au microphone accordé');
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
        console.log('[VoiceRecorder] Enregistrement terminé, durée:', durationRef.current);
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
      console.error('[VoiceRecorder] Erreur lors de l\'accès au microphone:', error);
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setPermissionDenied(true);
        alert('Permission microphone refusée. Veuillez autoriser l\'accès au microphone dans les paramètres de votre navigateur.');
      } else {
        alert('Impossible d\'accéder au microphone. Vérifiez que votre appareil dispose d\'un microphone.');
      }
      onCancel();
    }
  };

  // Démarrer l'enregistrement automatiquement au montage du composant
  useEffect(() => {
    startRecording();
    
    // Cleanup au démontage
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      // Ne pas appeler onRecordingComplete lors de l'annulation
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
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
        <span className="text-red-600">Permission microphone refusée</span>
        <div className="flex-1" />
        <Button onClick={onCancel} variant="secondary">
          <XMarkIcon className="w-5 h-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
      <div className="flex items-center space-x-2">
        {isRecording && <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />}
        <span className="text-red-600 font-medium">
          {isRecording ? formatTime(duration) : 'Démarrage...'}
        </span>
      </div>
      <div className="flex-1" />
      {isRecording && (
        <>
          <Button onClick={stopRecording} className="bg-green-500 hover:bg-green-600" title="Envoyer">
            <StopIcon className="w-5 h-5" />
          </Button>
          <Button onClick={cancelRecording} variant="secondary" title="Annuler">
            <XMarkIcon className="w-5 h-5" />
          </Button>
        </>
      )}
    </div>
  );
};

const Messaging: React.FC = () => {
  const { user, clients, messages, addMessage, markMessageAsRead } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [newMessage, setNewMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientForNewConversation, setClientForNewConversation] = useState('');

  const isCoach = user?.role === 'coach' || user?.role === 'admin';

  const myClients = useMemo(() => {
    const baseClients = clients.filter((c) => c.role === 'client');
    if (user?.role === 'coach') {
      return baseClients.filter((c) => c.coachId === user.id);
    }
    return baseClients; // for admin
  }, [clients, user]);

  const conversationClientIds = useMemo(() => {
    const ids = new Set<string>();
    messages.forEach((msg) => {
      if (msg.senderId === user?.id) {
        const client = myClients.find((c) => c.id === msg.recipientId);
        if (client) ids.add(msg.recipientId);
      } else if (msg.recipientId === user?.id) {
        const client = myClients.find((c) => c.id === msg.senderId);
        if (client) ids.add(msg.senderId);
      }
    });
    return Array.from(ids);
  }, [messages, myClients, user]);

  const selectedClientId = searchParams.get('clientId');

  useEffect(() => {
    if (!selectedClientId && conversationClientIds.length > 0) {
      navigate(`/app/messagerie?clientId=${conversationClientIds[0]}`, { replace: true });
    }
  }, [selectedClientId, conversationClientIds, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedClientId]);

  useEffect(() => {
    if (user && selectedClientId) {
      // Marquer les messages non lus comme lus
      const unreadMessages = messages.filter(
        (m) => m.senderId === selectedClientId && m.recipientId === user.id && !m.readAt && !m.isRead
      );

      unreadMessages.forEach(async (msg) => {
        try {
          await markMessageAsRead(msg.id);
        } catch (error) {
          console.error('Erreur lors du marquage du message comme lu:', error);
        }
      });
    }
  }, [user, selectedClientId, messages, markMessageAsRead]);

  const selectedClient = useMemo(() => {
    return clients.find((c) => c.id === selectedClientId);
  }, [selectedClientId, clients]);

  const conversation = useMemo(() => {
    if (!selectedClientId) return [];
    return messages
      .filter(
        (m) =>
          (m.senderId === user?.id && m.recipientId === selectedClientId) ||
          (m.senderId === selectedClientId && m.recipientId === user?.id)
      )
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [selectedClientId, messages, user]);

  const handleSendMessage = async (
    messageType: MessageType = 'text',
    content: string = newMessage.trim(),
    attachmentData?: { url: string; name: string; type: string; duration?: number }
  ) => {
    if ((!content && messageType === 'text') || !user || !selectedClientId) return;

    try {
      await addMessage({
        senderId: user.id,
        recipientId: selectedClientId,
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
    }
  };

  const handleVoiceRecordingComplete = async (blob: Blob, duration: number) => {
    setIsRecording(false);
    setIsUploading(true);

    try {
      const fileName = `voice_${user?.id}_${Date.now()}.webm`;
      const filePath = `${selectedClientId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('voice-messages')
        .upload(filePath, blob, {
          contentType: 'audio/webm',
        });

      if (error) throw error;

      // Créer une URL signée pour le bucket privé (1 heure d'expiration)
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

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedClientId) return;

    setIsUploading(true);

    try {
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `${selectedClientId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('client-documents')
        .upload(filePath, file, {
          contentType: file.type,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('client-documents')
        .getPublicUrl(filePath);

      await handleSendMessage('document', `📎 ${file.name}`, {
        url: urlData.publicUrl,
        name: file.name,
        type: file.type,
      });
    } catch (error) {
      console.error('Erreur lors de l\'upload du document:', error);
      alert('Erreur lors de l\'envoi du document.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const clientsForNewConversation = useMemo(() => {
    return myClients.filter((client) => !conversationClientIds.includes(client.id));
  }, [myClients, conversationClientIds]);

  const startNewConversation = () => {
    if (clientForNewConversation) {
      navigate(`/app/messagerie?clientId=${clientForNewConversation}`);
      setIsModalOpen(false);
    }
  };

  // Rendu d'un message
  const renderMessage = (msg: Message) => {
    const isMe = msg.senderId === user?.id;

    return (
      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
        <div
          className={`max-w-md px-4 py-2 rounded-xl ${
            isMe ? 'bg-primary text-white' : 'bg-white border'
          }`}
        >
          {/* Contenu selon le type de message */}
          {msg.messageType === 'voice' && msg.voiceUrl ? (
            <VoiceMessagePlayer url={msg.voiceUrl} duration={msg.voiceDuration} isMe={isMe} />
          ) : msg.messageType === 'document' && msg.attachmentUrl ? (
            <>
              <AttachmentDisplay message={msg} isMe={isMe} />
              {msg.content && !msg.content.startsWith('📎') && (
                <p className="mt-2">{msg.content}</p>
              )}
            </>
          ) : (
            <p>{msg.content || msg.text}</p>
          )}

          {/* Horodatage et indicateur de lecture */}
          <div className={`flex items-center justify-end mt-1 ${isMe ? 'text-violet-200' : 'text-gray-400'}`}>
            <span className="text-xs">
              {new Date(msg.timestamp).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            {/* Indicateur de lecture uniquement pour les messages envoyés par le coach */}
            {isMe && isCoach && <ReadIndicator message={msg} isCoach={isCoach} />}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-[calc(100vh-150px)]">
      {/* Sidebar */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-lg font-bold">Conversations</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversationClientIds.map((clientId) => {
            const client = clients.find((c) => c.id === clientId);
            if (!client) return null;
            
            // Trouver le dernier message de cette conversation
            const conversationMessages = messages.filter(
              (m) =>
                (m.senderId === user?.id && m.recipientId === clientId) ||
                (m.senderId === clientId && m.recipientId === user?.id)
            );
            const lastMessage = conversationMessages.sort(
              (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            )[0];
            
            const isUnread = lastMessage && lastMessage.senderId !== user?.id && !lastMessage.readAt && !lastMessage.isRead;

            return (
              <div
                key={clientId}
                onClick={() => navigate(`/app/messagerie?clientId=${clientId}`)}
                className={`p-4 flex items-center space-x-3 cursor-pointer border-l-4 ${
                  selectedClientId === clientId
                    ? 'bg-gray-100 border-primary'
                    : 'border-transparent hover:bg-gray-50'
                }`}
              >
                <img
                  src={getUserAvatarUrl(client, 40)}
                  alt={client.firstName}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-center">
                    <p className={`font-semibold ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                      {client.firstName} {client.lastName}
                    </p>
                    {isUnread && <span className="w-2.5 h-2.5 bg-primary rounded-full"></span>}
                  </div>
                  {lastMessage && (
                    <p className="text-sm text-gray-500 truncate">
                      {lastMessage.messageType === 'voice'
                        ? '🎤 Message vocal'
                        : lastMessage.messageType === 'document'
                        ? `📎 ${lastMessage.attachmentName || 'Document'}`
                        : lastMessage.content || lastMessage.text}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="p-2 border-t">
          <Button className="w-full" onClick={() => setIsModalOpen(true)}>
            <PlusIcon className="w-5 h-5 mr-2 inline-block" /> Nouvelle conversation
          </Button>
        </div>
      </div>

      {/* Chat window */}
      <Card className="w-2/3 flex flex-col">
        {selectedClient ? (
          <>
            <div className="p-4 border-b flex items-center space-x-3">
              <img
                src={getUserAvatarUrl(selectedClient, 40)}
                alt={selectedClient.firstName}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <h2 className="text-lg font-bold">
                  {selectedClient.firstName} {selectedClient.lastName}
                </h2>
              </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
              <div className="space-y-4">
                {conversation.map(renderMessage)}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Zone de saisie */}
            {isRecording ? (
              <div className="p-4 bg-white border-t">
                <VoiceRecorder
                  onRecordingComplete={handleVoiceRecordingComplete}
                  onCancel={() => setIsRecording(false)}
                />
              </div>
            ) : (
              <div className="p-4 bg-white border-t flex items-center space-x-2">
                {/* Bouton pièce jointe (coach uniquement) */}
                {isCoach && (
                  <>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                    />
                    <Button
                      variant="secondary"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      title="Joindre un document"
                    >
                      <PaperClipIcon className="w-5 h-5" />
                    </Button>
                  </>
                )}

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
                  disabled={isUploading}
                />

                {/* Bouton vocal (coach uniquement) */}
                {isCoach && (
                  <Button
                    variant="secondary"
                    onClick={() => setIsRecording(true)}
                    disabled={isUploading}
                    title="Enregistrer un message vocal"
                  >
                    <MicrophoneIcon className="w-5 h-5" />
                  </Button>
                )}

                <Button onClick={() => handleSendMessage()} disabled={isUploading || !newMessage.trim()}>
                  <PaperAirplaneIcon className="w-5 h-5" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Sélectionnez une conversation pour commencer.</p>
          </div>
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nouvelle conversation"
      >
        <div className="space-y-4">
          <Select
            label="Choisir un client"
            value={clientForNewConversation}
            onChange={(e) => setClientForNewConversation(e.target.value)}
          >
            <option value="">-- Sélectionnez --</option>
            {clientsForNewConversation.map((c) => (
              <option key={c.id} value={c.id}>
                {c.firstName} {c.lastName}
              </option>
            ))}
          </Select>
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={startNewConversation} disabled={!clientForNewConversation}>
              Démarrer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Messaging;
