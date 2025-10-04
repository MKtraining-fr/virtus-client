import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';
import { Client } from '../types';

interface ImpersonationModalProps {
    isOpen: boolean;
    onClose: () => void;
    roleToImpersonate: 'coach' | 'client';
}

const ImpersonationModal: React.FC<ImpersonationModalProps> = ({ isOpen, onClose, roleToImpersonate }) => {
    const { clients, impersonate } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredUsers = useMemo(() => {
        const usersInRole = clients.filter(c => c.role === roleToImpersonate);
        if (!searchTerm) {
            return usersInRole;
        }
        const lowercasedFilter = searchTerm.toLowerCase();
        return usersInRole.filter(user =>
            user.firstName.toLowerCase().includes(lowercasedFilter) ||
            user.lastName.toLowerCase().includes(lowercasedFilter) ||
            user.email.toLowerCase().includes(lowercasedFilter)
        );
    }, [clients, roleToImpersonate, searchTerm]);

    const handleImpersonate = (userId: string) => {
        impersonate(userId);
        onClose();
    };
    
    useEffect(() => {
        if (!isOpen) {
            setSearchTerm('');
        }
    }, [isOpen]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Choisir un profil ${roleToImpersonate}`}>
            <div className="flex flex-col gap-4">
                <Input
                    type="text"
                    placeholder="Rechercher par nom, prénom, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="space-y-2 max-h-80 overflow-y-auto">
                    {filteredUsers.length > 0 ? (
                        filteredUsers.map((user: Client) => (
                            <div key={user.id} className="flex justify-between items-center p-2 border rounded-lg hover:bg-gray-50">
                                <span>{user.firstName} {user.lastName} ({user.email})</span>
                                <Button size="sm" onClick={() => handleImpersonate(user.id)}>
                                    Incarner
                                </Button>
                            </div>
                        ))
                    ) : (
                         <p className="text-gray-500 text-center py-4">
                            Aucun utilisateur trouvé.
                        </p>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default ImpersonationModal;