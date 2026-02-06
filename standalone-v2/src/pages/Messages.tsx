import { MessageCircle, Send, Search, Check, CheckCheck } from 'lucide-react';
import { useState } from 'react';
import { Card, Button, Input, Badge } from '../components/ui';

const Messages = () => {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Données mockées
  const conversations = [
    {
      id: 1,
      name: 'Coach Alexandre',
      avatar: '👨‍🏫',
      lastMessage: 'Super séance aujourd\'hui ! Continue comme ça 💪',
      timestamp: 'Il y a 5 min',
      unread: 2,
      online: true,
    },
    {
      id: 2,
      name: 'Support Virtus',
      avatar: '🎯',
      lastMessage: 'Votre abonnement a été renouvelé avec succès',
      timestamp: 'Hier',
      unread: 0,
      online: false,
    },
    {
      id: 3,
      name: 'Nutritionniste Marie',
      avatar: '👩‍⚕️',
      lastMessage: 'J\'ai préparé ton plan alimentaire pour la semaine',
      timestamp: 'Il y a 2 jours',
      unread: 1,
      online: false,
    },
  ];

  const messages = [
    {
      id: 1,
      sender: 'coach',
      content: 'Salut ! Comment s\'est passée ta séance d\'hier ?',
      timestamp: '14:30',
      read: true,
    },
    {
      id: 2,
      sender: 'user',
      content: 'Très bien ! J\'ai réussi à augmenter mes charges sur le développé couché 🔥',
      timestamp: '14:32',
      read: true,
    },
    {
      id: 3,
      sender: 'coach',
      content: 'Excellent ! C\'est exactement ce qu\'on voulait. Continue à ce rythme !',
      timestamp: '14:35',
      read: true,
    },
    {
      id: 4,
      sender: 'user',
      content: 'Merci ! Par contre j\'ai une question sur le tempo 3-0-1-0...',
      timestamp: '14:36',
      read: true,
    },
    {
      id: 5,
      sender: 'coach',
      content: 'Super séance aujourd\'hui ! Continue comme ça 💪',
      timestamp: '15:20',
      read: false,
    },
  ];

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      console.log('Sending message:', messageInput);
      setMessageInput('');
    }
  };

  if (selectedConversation === null) {
    // Liste des conversations
    return (
      <div className="px-4 py-4 space-y-4">
        {/* Barre de recherche */}
        <Input
          type="text"
          placeholder="Rechercher une conversation..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          icon={<Search size={18} />}
          fullWidth
        />

        {/* Liste des conversations */}
        <div className="space-y-2">
          {conversations.map((conv) => (
            <Card
              key={conv.id}
              variant="elevated"
              padding="md"
              clickable
              onClick={() => setSelectedConversation(conv.id)}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center text-2xl">
                    {conv.avatar}
                  </div>
                  {conv.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-bg-primary dark:border-bg-primary rounded-full" />
                  )}
                </div>

                {/* Contenu */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-text-primary dark:text-text-primary text-sm font-black truncate">{conv.name}</h3>
                    <span className="text-[10px] text-text-tertiary dark:text-text-tertiary flex-shrink-0 ml-2">{conv.timestamp}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-text-secondary dark:text-text-secondary text-xs truncate flex-1">{conv.lastMessage}</p>
                    {conv.unread > 0 && (
                      <div className="flex-shrink-0 ml-2">
                        <Badge variant="default" size="sm">{conv.unread}</Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Message d'information */}
        <Card variant="outlined" padding="md" className="border-blue-600/30 bg-blue-600/10 text-center">
          <MessageCircle size={32} className="text-blue-400 mx-auto mb-2" />
          <p className="text-blue-400 text-sm font-medium mb-1">
            Messagerie sécurisée
          </p>
          <p className="text-text-tertiary dark:text-text-tertiary text-xs">
            Communiquez directement avec votre coach et l'équipe Virtus
          </p>
        </Card>
      </div>
    );
  }

  // Vue de conversation
  const currentConv = conversations.find(c => c.id === selectedConversation);

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header de conversation */}
      <div className="px-4 py-3 bg-bg-card dark:bg-bg-card border-b border-border dark:border-border flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedConversation(null)}
        >
          ← Retour
        </Button>
        <div className="flex-1 flex items-center gap-2">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center text-xl">
              {currentConv?.avatar}
            </div>
            {currentConv?.online && (
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-bg-primary dark:border-bg-primary rounded-full" />
            )}
          </div>
          <div>
            <h3 className="text-text-primary dark:text-text-primary text-sm font-black">{currentConv?.name}</h3>
            <p className="text-text-tertiary dark:text-text-tertiary text-[10px]">
              {currentConv?.online ? 'En ligne' : 'Hors ligne'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                  isUser
                    ? 'bg-gradient-to-br from-brand-600 to-brand-500 text-white'
                    : 'bg-bg-card dark:bg-bg-card border border-border dark:border-border text-text-primary dark:text-text-primary'
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                <div className={`flex items-center gap-1 mt-1 ${
                  isUser ? 'justify-end' : 'justify-start'
                }`}>
                  <span className={`text-[10px] ${
                    isUser ? 'text-brand-100' : 'text-text-tertiary dark:text-text-tertiary'
                  }`}>
                    {msg.timestamp}
                  </span>
                  {isUser && (
                    msg.read ? (
                      <CheckCheck size={12} className="text-brand-100" />
                    ) : (
                      <Check size={12} className="text-brand-100" />
                    )
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input de message */}
      <div className="px-4 py-3 bg-bg-card dark:bg-bg-card border-t border-border dark:border-border">
        <div className="flex items-center gap-2">
          <Input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Écrivez votre message..."
            fullWidth
          />
          <Button
            variant="primary"
            size="md"
            onClick={handleSendMessage}
            disabled={!messageInput.trim()}
            icon={<Send size={20} />}
          />
        </div>
      </div>
    </div>
  );
};

export default Messages;
