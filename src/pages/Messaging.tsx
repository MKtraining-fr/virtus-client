import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Message } from '../types';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Select from '../components/Select';
import { useAuth } from '../context/AuthContext';
import { PaperAirplaneIcon, PlusIcon } from '../constants/icons';


const Messaging: React.FC = () => {
    const { user, clients, messages, setMessages } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const [newMessage, setNewMessage] = useState('');
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

    const conversationClientIds = useMemo(() => {
        const ids = new Set<string>();
        messages.forEach(msg => {
            const client = myClients.find(c => c.id === msg.clientId);
            if (client) ids.add(msg.clientId);
        });
        return Array.from(ids);
    }, [messages, myClients]);

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
            const hasUnread = messages.some(m => m.clientId === selectedClientId && m.senderId === selectedClientId && !m.seenByCoach);
            if (hasUnread) {
                const updatedMessages = messages.map(m => {
                    if (m.clientId === selectedClientId && m.senderId === selectedClientId && !m.seenByCoach) {
                        return { ...m, seenByCoach: true };
                    }
                    return m;
                });
                setMessages(updatedMessages);
            }
        }
    }, [user, selectedClientId, messages, setMessages]);

    const selectedClient = useMemo(() => {
        return clients.find(c => c.id === selectedClientId);
    }, [selectedClientId, clients]);

    const conversation = useMemo(() => {
        if (!selectedClientId) return [];
        return messages.filter(m => m.clientId === selectedClientId);
    }, [selectedClientId, messages]);

    const handleSendMessage = () => {
        if (!newMessage.trim() || !user || !selectedClientId) return;

        const newMessageObj: Message = {
            id: `msg-${Date.now()}`,
            senderId: user.id,
            clientId: selectedClientId,
            text: newMessage.trim(),
            timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            isVoice: false,
            seenByCoach: true,
            seenByClient: false
        };
        setMessages([...messages, newMessageObj]);
        setNewMessage('');
    };

    const clientsForNewConversation = useMemo(() => {
        return myClients.filter(client => !conversationClientIds.includes(client.id));
    }, [myClients, conversationClientIds]);

    const startNewConversation = () => {
        if (clientForNewConversation) {
            navigate(`/app/messagerie?clientId=${clientForNewConversation}`);
            setIsModalOpen(false);
        }
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
                        const lastMessage = messages.filter(m => m.clientId === clientId).slice(-1)[0];
                        const isUnread = lastMessage && lastMessage.senderId !== user?.id && !lastMessage.seenByCoach;

                        return (
                            <div key={clientId} onClick={() => navigate(`/app/messagerie?clientId=${clientId}`)}
                                 className={`p-4 flex items-center space-x-3 cursor-pointer border-l-4 ${selectedClientId === clientId ? 'bg-gray-100 border-primary' : 'border-transparent hover:bg-gray-50'}`}>
                                <img src={client.avatar || `https://i.pravatar.cc/40?u=${client.id}`} alt={client.firstName} className="w-10 h-10 rounded-full" />
                                <div className="flex-1 overflow-hidden">
                                    <div className="flex justify-between items-center">
                                        <p className={`font-semibold ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>{client.firstName} {client.lastName}</p>
                                        {isUnread && <span className="w-2.5 h-2.5 bg-primary rounded-full"></span>}
                                    </div>
                                    {lastMessage && <p className="text-sm text-gray-500 truncate">{lastMessage.text}</p>}
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
                                    return (
                                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-md px-4 py-2 rounded-xl ${isMe ? 'bg-primary text-white' : 'bg-white border'}`}>
                                                <p>{msg.text}</p>
                                                <p className={`text-xs mt-1 text-right ${isMe ? 'text-violet-200' : 'text-gray-400'}`}>{msg.timestamp}</p>
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
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSendMessage(); }}}
                            />
                            <Button onClick={handleSendMessage}> <PaperAirplaneIcon className="w-5 h-5"/> </Button>
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
                    <Select label="Choisir un client" value={clientForNewConversation} onChange={(e) => setClientForNewConversation(e.target.value)}>
                        <option value="">-- Sélectionnez --</option>
                        {clientsForNewConversation.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
                    </Select>
                    <div className="flex justify-end space-x-2">
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                        <Button onClick={startNewConversation} disabled={!clientForNewConversation}>Démarrer</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Messaging;