import { MessageCircle, Send, Search, User, Clock, Check, CheckCheck } from 'lucide-react';
import { useState } from 'react';

const Messages = () => {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState('');

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
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Rechercher une conversation..."
            className="w-full bg-gray-900/50 border border-gray-800 rounded-lg pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-600 transition-colors"
          />
        </div>

        {/* Liste des conversations */}
        <div className="space-y-2">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => setSelectedConversation(conv.id)}
              className="bg-gradient-to-br from-gray-900/50 to-gray-900/20 border border-gray-800 rounded-xl p-4 active:scale-95 transition-transform cursor-pointer"
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-violet-400 flex items-center justify-center text-2xl">
                    {conv.avatar}
                  </div>
                  {conv.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-black rounded-full" />
                  )}
                </div>

                {/* Contenu */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-white text-sm font-bold truncate">{conv.name}</h3>
                    <span className="text-[10px] text-gray-500 flex-shrink-0 ml-2">{conv.timestamp}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-gray-400 text-xs truncate flex-1">{conv.lastMessage}</p>
                    {conv.unread > 0 && (
                      <div className="bg-violet-600 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 ml-2">
                        <span className="text-white text-[10px] font-bold">{conv.unread}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Message d'information */}
        <div className="rounded-xl border border-blue-600/30 bg-gradient-to-br from-blue-600/10 to-blue-600/5 p-4 text-center mt-6">
          <MessageCircle size={32} className="text-blue-400 mx-auto mb-2" />
          <p className="text-blue-400 text-sm font-medium mb-1">
            Messagerie sécurisée
          </p>
          <p className="text-gray-500 text-xs">
            Communiquez directement avec votre coach et l'équipe Virtus
          </p>
        </div>
      </div>
    );
  }

  // Vue de conversation
  const currentConv = conversations.find(c => c.id === selectedConversation);

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header de conversation */}
      <div className="px-4 py-3 bg-gradient-to-r from-gray-900/80 to-gray-900/50 border-b border-gray-800 flex items-center gap-3">
        <button
          onClick={() => setSelectedConversation(null)}
          className="text-violet-400 text-sm font-medium"
        >
          ← Retour
        </button>
        <div className="flex-1 flex items-center gap-2">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-violet-400 flex items-center justify-center text-xl">
              {currentConv?.avatar}
            </div>
            {currentConv?.online && (
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-black rounded-full" />
            )}
          </div>
          <div>
            <h3 className="text-white text-sm font-bold">{currentConv?.name}</h3>
            <p className="text-gray-500 text-[10px]">
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
                    ? 'bg-gradient-to-br from-violet-600 to-violet-500 text-white'
                    : 'bg-gray-900/80 border border-gray-800 text-white'
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                <div className={`flex items-center gap-1 mt-1 ${
                  isUser ? 'justify-end' : 'justify-start'
                }`}>
                  <span className={`text-[10px] ${
                    isUser ? 'text-violet-200' : 'text-gray-500'
                  }`}>
                    {msg.timestamp}
                  </span>
                  {isUser && (
                    msg.read ? (
                      <CheckCheck size={12} className="text-violet-200" />
                    ) : (
                      <Check size={12} className="text-violet-200" />
                    )
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input de message */}
      <div className="px-4 py-3 bg-gradient-to-t from-gray-900/80 to-gray-900/50 border-t border-gray-800">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Écrivez votre message..."
            className="flex-1 bg-gray-900/50 border border-gray-800 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-600 transition-colors"
          />
          <button
            onClick={handleSendMessage}
            disabled={!messageInput.trim()}
            className="bg-gradient-to-r from-violet-600 to-violet-500 rounded-lg p-3 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Messages;
