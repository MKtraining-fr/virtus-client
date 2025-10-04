import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import { WorkoutProgram, WorkoutSession, Client } from '../types';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import Input from '../components/Input';

const WorkoutLibrary: React.FC = () => {
    const { user, clients, setClients, programs, sessions } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('programs');
    
    // Modal State
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [itemToAssign, setItemToAssign] = useState<WorkoutProgram | WorkoutSession | null>(null);
    const [selectedClientsForAssign, setSelectedClientsForAssign] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const myClients = useMemo(() => {
        return clients.filter(c => c.role === 'client' && c.status === 'active' && c.coachId === user?.id);
    }, [clients, user]);

    const filteredClientsForModal = useMemo(() => {
        if (!searchTerm) return myClients;
        const lowercasedFilter = searchTerm.toLowerCase();
        return myClients.filter(c => 
            c.firstName.toLowerCase().includes(lowercasedFilter) ||
            c.lastName.toLowerCase().includes(lowercasedFilter)
        );
    }, [myClients, searchTerm]);

    const handleOpenAssignModal = (item: WorkoutProgram | WorkoutSession) => {
        setItemToAssign(item);
        setIsAssignModalOpen(true);
        setSelectedClientsForAssign([]);
        setSearchTerm('');
    };

    const handleToggleClientSelection = (clientId: string) => {
        setSelectedClientsForAssign(prev => 
            prev.includes(clientId) ? prev.filter(id => id !== clientId) : [...prev, clientId]
        );
    };

    const handleAssign = () => {
        if (!itemToAssign || selectedClientsForAssign.length === 0) return;

        let programToAssign: WorkoutProgram;

        // Type guard to check if item is a session and convert it to a program
        if ('exercises' in itemToAssign && !('sessionsByWeek' in itemToAssign)) {
            const session = itemToAssign as WorkoutSession;
            programToAssign = {
                id: `prog-from-sess-${session.id}-${Date.now()}`,
                name: session.name,
                objective: 'Séance unique',
                weekCount: 1,
                sessionsByWeek: { 1: [session] },
            };
        } else {
            programToAssign = itemToAssign as WorkoutProgram;
        }

        const updatedClients = clients.map(client => {
            if (selectedClientsForAssign.includes(client.id)) {
                const isAlreadyAssigned = client.assignedPrograms?.some(p => p.id === programToAssign.id);
                if (isAlreadyAssigned) return client; // Do not re-assign

                const hasCurrentProgram = client.assignedPrograms && client.assignedPrograms.length > 0;
                if (hasCurrentProgram) {
                    // Add as next program
                    const updatedPrograms = [...client.assignedPrograms];
                    updatedPrograms.splice(1, 0, programToAssign);
                    return {
                        ...client,
                        assignedPrograms: updatedPrograms,
                        viewed: false,
                    };
                } else {
                    // Set as current program
                    return { 
                        ...client, 
                        assignedPrograms: [programToAssign],
                        programWeek: 1,
                        sessionProgress: 1,
                        totalWeeks: programToAssign.weekCount,
                        totalSessions: programToAssign.sessionsByWeek[1]?.length || 0,
                        viewed: false,
                    };
                }
            }
            return client;
        });

        setClients(updatedClients);
        alert(`Élément assigné à ${selectedClientsForAssign.length} client(s).`);
        setIsAssignModalOpen(false);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Bibliothèque d'entraînements</h1>
                <Button onClick={() => navigate('/app/musculation/createur')}>
                    Nouveau programme
                </Button>
            </div>
            <div className="mb-6">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('programs')}
                            className={`${activeTab === 'programs' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Programmes
                        </button>
                        <button
                             onClick={() => setActiveTab('sessions')}
                             className={`${activeTab === 'sessions' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Séances
                        </button>
                    </nav>
                </div>
            </div>

            {activeTab === 'programs' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {programs.length === 0 && <p className="text-gray-500">Aucun programme enregistré pour le moment.</p>}
                    {programs.map(program => (
                        <Card key={program.id} className="flex flex-col">
                           <div className="p-6 flex-grow">
                             <h3 className="text-lg font-semibold text-gray-900">{program.name}</h3>
                             <p className="text-sm text-gray-500 mt-1">{program.sessionsByWeek[1]?.length || 0} séances · {program.weekCount} semaines</p>
                           </div>
                           <div className="bg-gray-50 p-4 flex justify-end space-x-2">
                                <Button variant="secondary" size="sm">Modifier</Button>
                                <Button size="sm" onClick={() => handleOpenAssignModal(program)}>Assigner</Button>
                           </div>
                        </Card>
                    ))}
                </div>
            )}
            
            {activeTab === 'sessions' && (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sessions.length === 0 && <p className="text-gray-500">Aucune séance enregistrée pour le moment.</p>}
                    {sessions.map((session: WorkoutSession) => (
                        <Card key={session.id} className="flex flex-col">
                           <div className="p-6 flex-grow">
                             <h3 className="text-lg font-semibold text-gray-900">{session.name}</h3>
                             <p className="text-sm text-gray-500 mt-1">{session.exercises.length} exercices</p>
                           </div>
                           <div className="bg-gray-50 p-4 flex justify-end space-x-2">
                                <Button variant="secondary" size="sm">Voir</Button>
                                <Button size="sm" onClick={() => handleOpenAssignModal(session)}>Assigner</Button>
                           </div>
                        </Card>
                    ))}
                </div>
            )}

            {isAssignModalOpen && itemToAssign && (
                 <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title={`Assigner "${itemToAssign.name}"`}>
                    <div className="space-y-4">
                        <Input 
                            type="text"
                            placeholder="Rechercher un client..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                            {filteredClientsForModal.length > 0 ? (
                                filteredClientsForModal.map(client => (
                                    <label key={client.id} className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0">
                                        <input 
                                            type="checkbox" 
                                            className="h-4 w-4 rounded text-primary focus:ring-primary"
                                            checked={selectedClientsForAssign.includes(client.id)}
                                            onChange={() => handleToggleClientSelection(client.id)}
                                        />
                                        <span className="ml-3 text-sm font-medium">{client.firstName} {client.lastName}</span>
                                    </label>
                                ))
                            ) : (
                                <p className="text-center text-gray-500 p-4">Aucun client trouvé.</p>
                            )}
                        </div>
                        <div className="flex justify-end space-x-2 pt-4">
                            <Button variant="secondary" onClick={() => setIsAssignModalOpen(false)}>Annuler</Button>
                            <Button onClick={handleAssign} disabled={selectedClientsForAssign.length === 0}>Assigner</Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default WorkoutLibrary;