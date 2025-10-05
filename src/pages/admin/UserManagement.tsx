import React, { useState, useMemo } from 'react';
import { Client } from '../../types';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Select from '../../components/Select';
import { useAuth } from '../../context/AuthContext';
import { useSortableData } from '../../hooks/useSortableData';

const SortIcon = ({ direction }: { direction: 'ascending' | 'descending' | null }) => {
  return (
    <span className="inline-block w-4 h-4 ml-1">
      {direction === 'ascending' && '▲'}
      {direction === 'descending' && '▼'}
    </span>
  );
};

const UserManagement: React.FC = () => {
    const { clients: allUsers, addUser, setClients } = useAuth();
    const [filter, setFilter] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'all' | 'coaches' | 'clients'>('all');
    
    // State for the modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [currentUser, setCurrentUser] = useState<Partial<Client> | null>(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const coaches = useMemo(() => allUsers.filter(u => u.role === 'coach'), [allUsers]);
    
    const usersForTable = useMemo(() => {
        if (activeTab === 'coaches') return allUsers.filter(u => u.role === 'coach');
        if (activeTab === 'clients') return allUsers.filter(u => u.role === 'client');
        return allUsers;
    }, [allUsers, activeTab]);

    const { items: sortedUsers, requestSort, getSortDirection } = useSortableData(usersForTable, { key: 'lastName', direction: 'ascending' });

    const filteredUsers = useMemo(() => {
        if (!filter) return sortedUsers;
        const lowercasedFilter = filter.toLowerCase();
        return sortedUsers.filter(user =>
            user.lastName?.toLowerCase().includes(lowercasedFilter) ||
            user.firstName?.toLowerCase().includes(lowercasedFilter) ||
            user.email?.toLowerCase().includes(lowercasedFilter) ||
            user.role?.toLowerCase().includes(lowercasedFilter)
        );
    }, [sortedUsers, filter]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            const selectableUsers = filteredUsers
                .filter(u => u.role !== 'admin')
                .map(u => u.id);
            setSelectedUsers(selectableUsers);
        } else {
            setSelectedUsers([]);
        }
    };

    const handleSelectOne = (id: string) => {
        setSelectedUsers(prev =>
            prev.includes(id) ? prev.filter(userId => userId !== id) : [...prev, id]
        );
    };

    const handleDeleteSelected = () => {
        if (selectedUsers.length === 0) return;
        const count = selectedUsers.length;
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${count} utilisateur(s) ? Cette action est irréversible.`)) {
            const idsToDelete = new Set(selectedUsers);
            const updatedUsers = allUsers.filter(u => !idsToDelete.has(u.id));
            setClients(updatedUsers);
            setSelectedUsers([]);
            alert(`${count} utilisateur(s) ont été supprimés.`);
        }
    };
    
    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCurrentUser(prev => (prev ? { ...prev, [name]: value } : null));
    };
    
    const openAddModal = () => {
        setModalMode('add');
        let defaultRole: 'coach' | 'client' = 'client';
        if (activeTab === 'coaches') {
            defaultRole = 'coach';
        }
        setCurrentUser({
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            role: defaultRole,
            coachId: '',
        });
        setError('');
        setIsModalOpen(true);
    };

    const openEditModal = (user: Client) => {
        setModalMode('edit');
        setCurrentUser({ ...user, password: '' }); // Don't pre-fill password
        setError('');
        setIsModalOpen(true);
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;
        
        setError('');
        setIsLoading(true);

        try {
            if (modalMode === 'add') {
                if (!currentUser.firstName || !currentUser.lastName || !currentUser.email || !currentUser.password) {
                    throw new Error("Tous les champs sont requis.");
                }
                await addUser(currentUser);
            } else { // Edit mode
                if (!currentUser.id) throw new Error("ID utilisateur manquant.");
                if (!currentUser.firstName || !currentUser.lastName || !currentUser.email) {
                    throw new Error("Le prénom, le nom et l'email sont requis.");
                }
                
                const updatedUsers = allUsers.map(u => {
                    if (u.id === currentUser.id) {
                        const updatedUser = { ...u, ...currentUser };
                        // Only update password if a new one is entered
                        if (!currentUser.password) {
                            updatedUser.password = u.password;
                        }
                        return updatedUser;
                    }
                    return u;
                });
                setClients(updatedUsers);
            }
            setIsModalOpen(false);
            setCurrentUser(null);
        } catch (err: any) {
            setError(err.message || "Une erreur est survenue.");
        } finally {
            setIsLoading(false);
        }
    };

    const renderHeader = (label: string, key: keyof Client) => (
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <button onClick={() => requestSort(key)} className="flex items-center hover:text-gray-700">
                {label}
                <SortIcon direction={getSortDirection(key)} />
            </button>
        </th>
    );

    const selectableUsersCount = useMemo(() => filteredUsers.filter(u => u.role !== 'admin').length, [filteredUsers]);
    const isAllSelected = useMemo(() => selectableUsersCount > 0 && selectedUsers.length === selectableUsersCount, [selectableUsersCount, selectedUsers]);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Gestion des utilisateurs</h1>
                 <div>
                    <Button 
                        variant="danger" 
                        onClick={handleDeleteSelected} 
                        disabled={selectedUsers.length === 0} 
                        className="mr-2"
                    >
                        Supprimer la sélection
                    </Button>
                    <Button onClick={openAddModal}>Ajouter un utilisateur</Button>
                </div>
            </div>

            <div className="mb-4">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`${activeTab === 'all' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Tous
                        </button>
                        <button
                            onClick={() => setActiveTab('coaches')}
                            className={`${activeTab === 'coaches' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Coachs
                        </button>
                        <button
                            onClick={() => setActiveTab('clients')}
                            className={`${activeTab === 'clients' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Clients & Prospects
                        </button>
                    </nav>
                </div>
            </div>

            <div className="mb-4">
                <Input 
                    type="text"
                    placeholder="Filtrer par nom, email, profil..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                />
            </div>
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="p-4">
                                     <input
                                        type="checkbox"
                                        onChange={handleSelectAll}
                                        checked={isAllSelected}
                                        disabled={selectableUsersCount === 0}
                                    />
                                </th>
                                {renderHeader('Nom', 'lastName')}
                                {renderHeader('Prénom', 'firstName')}
                                {renderHeader('Profil', 'role')}
                                {renderHeader('Adresse mail', 'email')}
                                {renderHeader('Coach Rattaché', 'coachId')}
                                {renderHeader('Code Affiliation', 'affiliationCode')}
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredUsers.map(user => (
                                <tr key={user.id} className={`hover:bg-gray-50 ${selectedUsers.includes(user.id) ? 'bg-primary/5' : ''}`}>
                                     <td className="p-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.includes(user.id)}
                                            onChange={() => handleSelectOne(user.id)}
                                            disabled={user.role === 'admin'}
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.lastName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.firstName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${
                                            user.role === 'admin' ? 'bg-red-100 text-red-800' :
                                            user.role === 'coach' ? 'bg-blue-100 text-blue-800' :
                                            'bg-green-100 text-green-800'
                                        }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {user.role === 'client' ? (() => {
                                            const assignedCoach = coaches.find(c => c.id === user.coachId);
                                            return assignedCoach ? `${assignedCoach.firstName} ${assignedCoach.lastName}` : 'Indépendant';
                                        })() : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{user.affiliationCode || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {user.role !== 'admin' && (
                                            <Button variant="secondary" size="sm" onClick={() => openEditModal(user)}>
                                                Modifier
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 {filteredUsers.length === 0 && (
                    <div className="text-center p-6 text-gray-500">
                        Aucun utilisateur trouvé.
                    </div>
                )}
            </Card>

             <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'add' ? "Ajouter un nouvel utilisateur" : "Modifier l'utilisateur"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Prénom" name="firstName" value={currentUser?.firstName || ''} onChange={handleFormChange} required />
                        <Input label="Nom" name="lastName" value={currentUser?.lastName || ''} onChange={handleFormChange} required />
                    </div>
                    <Input label="Email" name="email" type="email" value={currentUser?.email || ''} onChange={handleFormChange} required />
                    <div>
                        <Input 
                            label="Mot de passe" 
                            name="password" 
                            type="password" 
                            value={currentUser?.password || ''} 
                            onChange={handleFormChange} 
                            required={modalMode === 'add'} 
                            placeholder={modalMode === 'edit' ? "Laisser vide pour ne pas changer" : ""}
                        />
                        {modalMode === 'add' && (
                            <p className="mt-1 text-xs text-gray-500">
                                Le mot de passe doit contenir : 8 caractères minimum, une majuscule, une minuscule, un chiffre et un caractère spécial
                            </p>
                        )}
                    </div>
                    <Select label="Profil" name="role" value={currentUser?.role || 'client'} onChange={handleFormChange}>
                        <option value="client">Client</option>
                        <option value="coach">Coach</option>
                    </Select>
                    
                    {currentUser?.role === 'client' && (
                        <Select label="Coach Rattaché" name="coachId" value={currentUser.coachId || ''} onChange={handleFormChange}>
                            <option value="">Indépendant</option>
                            {coaches.map(coach => (
                                <option key={coach.id} value={coach.id}>{coach.firstName} {coach.lastName}</option>
                            ))}
                        </Select>
                    )}


                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}

                    <div className="flex justify-end pt-4 space-x-2">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Enregistrement...' : 'Enregistrer'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

export default UserManagement;