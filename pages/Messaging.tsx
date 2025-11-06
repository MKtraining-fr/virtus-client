
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Message } from '../types';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Select from '../components/Select';
import { useAuth } from '../src/context/AuthContext';

const PaperAirplaneIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
    </svg>
);

const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

const Messaging: React.FC = () => {
    const { user, clients, messages, addMessage, markMessageAsRead } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [clientForNewConversation, setClientForNewConversation] = useState('');

    const myClients = useMemo(() => {
        const baseClients = clients.filter(c => c.role === 'client');
        if (user?.role === 'coach') {
            return baseClients.filter(c => c.coachId === user.id);
        }
        return baseClients; // for admin
    }, [clients, user]);

    // Extraire les conversations uniques (paires d'interlocuteurs)
    const conversationClientIds = useMemo(() => {
        if (!user) return [];
        const ids = new Set<string>();
        messages.forEach(msg => {
            // Identifier l'autre personne dans la conversation
            const otherUserId = msg.senderId === user.id ? msg.recipientId : msg.senderId;
            // Vérifier que c'est un de nos clients
            const isMyClient = myClients.some(c => c.id === otherUserId);
            if (isMyClient) {
                ids.add(otherUserId);
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

    // Marquer les messages comme lus lorsqu'on ouvre une conversation
    useEffect(() => {
        if (user && selectedClientId) {
            const unreadMessages = messages.filter(
                m => m.recipientId === user.id && 
                     m.senderId === selectedClientId && 
                     !m.seenByRecipient
            );
            
            unreadMessages.forEach(msg => {
                markMessageAsRead(msg.id).catch(err => {
                    console.error('Erreur lors du marquage du message comme lu:', err);
                });
            });
        }
    }, [user, selectedClientId, messages, markMessageAsRead]);

    const selectedClient = useMemo(() => {
        return clients.find(c => c.id === selectedClientId);
    }, [selectedClientId, clients]);

    // Filtrer les messages de la conversation sélectionnée
    const conversation = useMemo(() => {
        if (!selectedClientId || !user) return [];
        return messages
            .filter(m => 
                (m.senderId === user.id && m.recipientId === selectedClientId) ||
                (m.senderId === selectedClientId && m.recipientId === user.id)
            )
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [selectedClientId, messages, user]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !user || !selectedClientId || isSending) return;

        setIsSending(true);
        const messageData = {
            senderId: user.id,
            recipientId: selectedClientId,
            content: newMessage.trim(),
            isVoice: false,
            seenBySender: true,
            seenByRecipient: false,
        };

        try {
            await addMessage(messageData as any);
            setNewMessage('');
        } catch (error) {
            console.error("Erreur lors de l'envoi du message:", error);
            alert("Erreur lors de l'envoi du message. Veuillez réessayer.");
        } finally {
            setIsSending(false);
        }
    };

    const clientsForNewConversation = useMemo(() => {
        return myClients.filter(client => !conversationClientIds.includes(client.id));
    }, [myClients, conversationClientIds]);

    const startNewConversation = () => {
        console.log('startNewConversation appelé, clientForNewConversation:', clientForNewConversation);
        if (clientForNewConversation) {
            console.log('Navigation vers:', `/app/messagerie?clientId=${clientForNewConversation}`);
            navigate(`/app/messagerie?clientId=${clientForNewConversation}`);
            setIsModalOpen(false);
            setClientForNewConversation(''); // Réinitialiser la sélection
        } else {
            console.log('Aucun client sélectionné');
        }
    };

    // Compter les messages non lus par conversation
    const getUnreadCount = (clientId: string) => {
        if (!user) return 0;
        return messages.filter(
            m => m.senderId === clientId && 
                 m.recipientId === user.id && 
                 !m.seenByRecipient
        ).length;
    };

    return (
        <div className="flex h-[calc(100vh-150px)]">
            {/* Sidebar */}
            <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b">
                    <h2 className="text-lg font-bold">Conversations</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {conversationClientIds.map(clientId => {
                        const client = clients.find(c => c.id === clientId);
                        if (!client) return null;
                        
                        // Trouver le dernier message de la conversation
                        const conversationMessages = messages.filter(
                            m => (m.senderId === user?.id && m.recipientId === clientId) ||
                                 (m.senderId === clientId && m.recipientId === user?.id)
                        );
                        const lastMessage = conversationMessages.sort(
                            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                        )[0];
                        
                        const unreadCount = getUnreadCount(clientId);

                        return (
                            <div key={clientId} onClick={() => navigate(`/app/messagerie?clientId=${clientId}`)}
                                 className={`p-4 flex items-center space-x-3 cursor-pointer border-l-4 ${selectedClientId === clientId ? 'bg-gray-100 border-primary' : 'border-transparent hover:bg-gray-50'}`}>
                                <img src={client.avatar || `https://i.pravatar.cc/40?u=${client.id}`} alt={client.firstName} className="w-10 h-10 rounded-full" />
                                <div className="flex-1 overflow-hidden">
                                    <div className="flex justify-between items-center">
                                        <p className={`font-semibold ${unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                                            {client.firstName} {client.lastName}
                                        </p>
                                        {unreadCount > 0 && (
                                            <span className="bg-primary text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                                                {unreadCount}
                                            </span>
                                        )}
                                    </div>
                                    {lastMessage && (
                                        <p className="text-sm text-gray-500 truncate">
                                            {lastMessage.senderId === user?.id ? 'Vous: ' : ''}
                                            {lastMessage.content}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="p-2 border-t">
                    <Button className="w-full" onClick={() => setIsModalOpen(true)}>
                       <PlusIcon className="w-5 h-5 mr-2 inline-block"/> Nouvelle conversation
                    </Button>
                </div>
            </div>
            {/* Chat window */}
            <Card className="w-2/3 flex flex-col">
                {selectedClient ? (
                    <>
                        <div className="p-4 border-b flex items-center space-x-3">
                            <img src={selectedClient.avatar || `https://i.pravatar.cc/40?u=${selectedClient.id}`} alt={selectedClient.firstName} className="w-10 h-10 rounded-full"/>
                            <div>
                                <h2 className="text-lg font-bold">{selectedClient.firstName} {selectedClient.lastName}</h2>
                            </div>
                        </div>
                        <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
                            <div className="space-y-4">
                                {conversation.map(msg => {
                                    const isMe = msg.senderId === user?.id;
                                    const messageTime = new Date(msg.timestamp).toLocaleTimeString('fr-FR', { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                    });
                                    return (
                                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-md px-4 py-2 rounded-xl ${isMe ? 'bg-primary text-white' : 'bg-white border'}`}>
                                                <p>{msg.content}</p>
                                                <p className={`text-xs mt-1 text-right ${isMe ? 'text-violet-200' : 'text-gray-400'}`}>
                                                    {messageTime}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>
                        <div className="p-4 bg-white border-t flex items-center space-x-2">
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
                                disabled={isSending}
                            />
                            <Button onClick={handleSendMessage} disabled={isSending || !newMessage.trim()}>
                                <PaperAirplaneIcon className="w-5 h-5"/> 
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        <p>Sélectionnez une conversation pour commencer.</p>
                    </div>
                )}
            </Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nouvelle conversation">
                <div className="space-y-4">
                    <div className="w-full" onClick={(e) => e.stopPropagation()}>
                        <label htmlFor="client-select" className="block text-sm font-medium text-gray-700 mb-1">
                            Choisir un client
                        </label>
                        <select
                            id="client-select"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-white text-gray-900"
                            value={clientForNewConversation}
                            onChange={(e) => {
                                e.stopPropagation();
                                console.log('Client sélectionné:', e.target.value);
                                setClientForNewConversation(e.target.value);
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <option value="">-- Sélectionnez --</option>
                            {clientsForNewConversation.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.firstName} {c.lastName}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end space-x-2">
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                        <Button 
                            onClick={startNewConversation} 
                            disabled={!clientForNewConversation}
                        >
                            Démarrer
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Messaging;
