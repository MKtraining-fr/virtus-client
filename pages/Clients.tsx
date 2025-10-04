
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Client } from '../types';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { useAuth } from '../src/context/AuthContext';

const SortIcon = ({ direction }: { direction: 'ascending' | 'descending' | null }) => {
  return (
    <span className="inline-block w-4 h-4 ml-1">
      {direction === 'ascending' && '▲'}
      {direction === 'descending' && '▼'}
    </span>
  );
};


const Clients: React.FC = () => {
    const { user, clients: allClients, setClients } = useAuth();
    const [selectedClients, setSelectedClients] = useState<string[]>([]);
    const [filter, setFilter] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof Client | null; direction: 'ascending' | 'descending' }>({ key: null, direction: 'ascending' });
    const navigate = useNavigate();

    const clients = useMemo(() => {
        const activeClients = allClients.filter(p => p.status === 'active' && p.role === 'client');
        if (user?.role === 'coach') {
            return activeClients.filter(c => c.coachId === user.id);
        }
        return activeClients;
    }, [allClients, user]);

    const requestSort = (key: keyof Client) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortDirection = (key: keyof Client) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction;
    }

    const filteredAndSortedClients = useMemo(() => {
        let sortableClients = [...clients];

        if (filter) {
            sortableClients = sortableClients.filter(client =>
                client.lastName?.toLowerCase().includes(filter.toLowerCase()) ||
                client.firstName?.toLowerCase().includes(filter.toLowerCase()) ||
                client.email?.toLowerCase().includes(filter.toLowerCase()) ||
                client.phone?.toLowerCase().includes(filter.toLowerCase())
            );
        }

        if (sortConfig.key) {
            sortableClients.sort((a, b) => {
                const aValue = a[sortConfig.key!];
                const bValue = b[sortConfig.key!];

                if (aValue === null || aValue === undefined) return 1;
                if (bValue === null || bValue === undefined) return -1;
                
                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableClients;
    }, [clients, filter, sortConfig]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedClients(filteredAndSortedClients.map(c => c.id!));
        } else {
            setSelectedClients([]);
        }
    };

    const handleSelectOne = (id: string) => {
        setSelectedClients(prev =>
            prev.includes(id) ? prev.filter(clientId => clientId !== id) : [...prev, id]
        );
    };
    
    const handleRowClick = (clientId: string) => {
        navigate(`/app/client/${clientId}`);
    };

    const handleArchiveSelected = () => {
        if (selectedClients.length === 0) return;
        const count = selectedClients.length;
        if (window.confirm(`Êtes-vous sûr de vouloir archiver ${count} client(s) ?`)) {
            const updatedClients = allClients.map((c): Client =>
                selectedClients.includes(c.id) ? { ...c, status: 'archived' } : c
            );
            setClients(updatedClients);
            setSelectedClients([]);
            alert(`${count} client(s) archivé(s) avec succès.`);
        }
    };

    const handleDeleteSelected = () => {
        if (selectedClients.length === 0) return;
        const count = selectedClients.length;
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement ${count} client(s) ? Cette action est irréversible.`)) {
            const idsToDelete = new Set(selectedClients);
            const updatedClients = allClients.filter(c => !idsToDelete.has(c.id));
            setClients(updatedClients);
            setSelectedClients([]);
            alert(`${count} client(s) supprimé(s) avec succès.`);
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

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Mes Clients</h1>
                <div>
                    <Button variant="secondary" className="mr-2" onClick={handleArchiveSelected} disabled={selectedClients.length === 0}>Archiver</Button>
                    <Button variant="danger" onClick={handleDeleteSelected} disabled={selectedClients.length === 0}>Supprimer</Button>
                </div>
            </div>
             <div className="mb-4">
                <Input 
                    type="text"
                    placeholder="Filtrer les clients..."
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
                                        checked={filteredAndSortedClients.length > 0 && selectedClients.length === filteredAndSortedClients.length}
                                        disabled={filteredAndSortedClients.length === 0}
                                    />
                                </th>
                                {renderHeader('Nom', 'lastName')}
                                {renderHeader('Prénom', 'firstName')}
                                {renderHeader('Âge', 'age')}
                                {renderHeader('Sexe', 'sex')}
                                {renderHeader('Email', 'email')}
                                {renderHeader('Téléphone', 'phone')}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredAndSortedClients.map(client => (
                                <tr key={client.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleRowClick(client.id!)}>
                                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                        <input type="checkbox" onChange={() => handleSelectOne(client.id!)} checked={selectedClients.includes(client.id!)} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{client.lastName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.firstName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.age}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.sex}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.phone}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default Clients;