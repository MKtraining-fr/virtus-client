
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Message } from '../../types';
import Input from '../../components/Input';

const PaperAirplaneIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
    </svg>
);

const ClientMessaging: React.FC = () => {
    const { user, clients, messages, setMessages } = useAuth();
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const coach = useMemo(() => {
        if (!user || !user.coachId) return null;
        return clients.find(c => c.id === user.coachId);
    }, [user, clients]);
    
    const conversation = useMemo(() => {
        if (!user) return [];
        return messages.filter(m => m.clientId === user.id);
    }, [messages, user]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView();
    }, [conversation]);

    useEffect(() => {
        if (user && coach) {
            const hasUnread = messages.some(m => m.clientId === user.id && m.senderId === coach.id && !m.seenByClient);
            if (hasUnread) {
                const updatedMessages = messages.map(m => {
                    if (m.clientId === user.id && m.senderId === coach.id && !m.seenByClient) {
                        return { ...m, seenByClient: true };
                    }
                    return m;
                });
                setMessages(updatedMessages);
            }
        }
    }, [user, coach, messages, setMessages]);

    const handleSendMessage = () => {
        if (!newMessage.trim() || !user) return;

        const newMessageObj: Message = {
            id: `msg-${Date.now()}`,
            senderId: user.id,
            clientId: user.id,
            text: newMessage.trim(),
            timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            isVoice: false,
            seenByCoach: false,
            seenByClient: true
        };

        setMessages([...messages, newMessageObj]);
        setNewMessage('');
    };

    if (!user) return null;

    if (!coach) {
        return (
            <div className="flex flex-col h-full items-center justify-center text-center p-4">
                <p className="dark:text-client-light text-gray-800">Vous n'êtes assigné à aucun coach.</p>
                <p className="dark:text-client-subtle text-gray-500 text-sm mt-1">Vous ne pouvez pas utiliser la messagerie pour le moment.</p>
            </div>
        );
    }
    
    return (
      <div className="flex flex-col h-[calc(100vh-140px)] bg-white dark:bg-client-card rounded-lg overflow-hidden">
          <div className="flex-1 flex flex-col">
              <div className="p-4 border-b border-gray-200 dark:border-client-dark flex items-center space-x-3 sticky top-0 bg-white dark:bg-client-card z-10">
                  <img src={coach.avatar || `https://i.pravatar.cc/40?u=${coach.id}`} alt={coach.firstName} className="w-10 h-10 rounded-full"/>
                  <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-client-light">{coach.firstName} {coach.lastName}</h2>
                  </div>
              </div>
              
              <div className="flex-1 p-4 md:p-6 overflow-y-auto bg-gray-50 dark:bg-client-dark">
                  <div className="space-y-4">
                      {conversation.map(msg => {
                          const isMe = msg.senderId === user.id;
                          return (
                              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                  <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${isMe ? 'bg-primary text-white rounded-br-none' : 'bg-white border dark:border-transparent dark:bg-gray-700 text-gray-800 dark:text-client-light rounded-bl-none'}`}>
                                      <p className="text-sm">{msg.text}</p>
                                      <p className={`text-xs mt-1 text-right ${isMe ? 'text-violet-200' : 'text-gray-500 dark:text-client-subtle'}`}>{msg.timestamp}</p>
                                  </div>
                              </div>
                          );
                      })}
                      <div ref={messagesEndRef} />
                  </div>
              </div>
              
              <div className="p-2 md:p-4 bg-white dark:bg-client-card border-t border-gray-200 dark:border-client-dark flex items-center space-x-2">
                  <Input 
                    placeholder="Écrire un message..." 
                    className="flex-1"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                  />
                  <button onClick={handleSendMessage} className="p-3 rounded-full bg-primary text-white flex-shrink-0">
                      <PaperAirplaneIcon className="w-5 h-5"/>
                  </button>
              </div>
          </div>
      </div>
    );
};

export default ClientMessaging;
