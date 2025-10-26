import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ProfessionalFormation } from '../../types';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Select from '../../components/Select';

const initialFormationState: Omit<ProfessionalFormation, 'id'> = {
    title: '',
    description: '',
    price: 0,
    coverImageUrl: '',
    accessType: 'purchase',
};

const ProFormationManagement: React.FC = () => {
    const { professionalFormations, setProfessionalFormations } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [currentFormation, setCurrentFormation] = useState<Partial<ProfessionalFormation> | null>(null);

    const openModal = (mode: 'add' | 'edit', formation: Partial<ProfessionalFormation> | null = null) => {
        setModalMode(mode);
        setCurrentFormation(mode === 'add' ? { ...initialFormationState } : formation);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentFormation(null);
    };

    const handleSave = () => {
        if (!currentFormation || !currentFormation.title || !currentFormation.description || !currentFormation.price) {
            alert("Tous les champs sont requis.");
            return;
        }

        if (modalMode === 'add') {
            const newFormation: ProfessionalFormation = {
                id: `proform-${Date.now()}`,
                ...initialFormationState,
                ...currentFormation,
            };
            setProfessionalFormations([...professionalFormations, newFormation]);
        } else {
            const updatedFormations = professionalFormations.map(f =>
                f.id === currentFormation.id ? { ...f, ...currentFormation } : f
            );
            setProfessionalFormations(updatedFormations as ProfessionalFormation[]);
        }
        closeModal();
    };

    const handleDelete = (formationId: string) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cette formation ?")) {
            setProfessionalFormations(professionalFormations.filter(f => f.id !== formationId));
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Gestion des Formations Professionnelles</h1>
                <Button onClick={() => openModal('add')}>Ajouter une formation</Button>
            </div>
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Titre</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Prix</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Type d'accès</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y">
                            {professionalFormations.map(formation => (
                                <tr key={formation.id}>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{formation.title}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{formation.price} €</td>
                                    <td className="px-6 py-4 whitespace-nowrap capitalize text-gray-700">{formation.accessType === 'purchase' ? 'Achat unique' : 'Abonnement'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap space-x-2">
                                        <Button size="sm" variant="secondary" onClick={() => openModal('edit', formation)}>Modifier</Button>
                                        <Button size="sm" variant="danger" onClick={() => handleDelete(formation.id)}>Supprimer</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {isModalOpen && currentFormation && (
                <Modal isOpen={isModalOpen} onClose={closeModal} title={modalMode === 'add' ? "Ajouter une Formation" : "Modifier la Formation"}>
                    <div className="space-y-4">
                        <Input label="Titre" value={currentFormation.title} onChange={e => setCurrentFormation(p => p ? { ...p, title: e.target.value } : null)} />
                        <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                           <textarea value={currentFormation.description} onChange={e => setCurrentFormation(p => p ? { ...p, description: e.target.value } : null)} rows={4} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"></textarea>
                        </div>
                        <Input label="URL de l'image de couverture" value={currentFormation.coverImageUrl} onChange={e => setCurrentFormation(p => p ? { ...p, coverImageUrl: e.target.value } : null)} />
                        <Input label="Prix (€)" type="number" value={currentFormation.price} onChange={e => setCurrentFormation(p => p ? { ...p, price: parseFloat(e.target.value) || 0 } : null)} />
                        <Select label="Type d'accès" value={currentFormation.accessType} onChange={e => setCurrentFormation(p => p ? { ...p, accessType: e.target.value as 'purchase' | 'subscription' } : null)}>
                            <option value="purchase">Achat unique</option>
                            <option value="subscription">Abonnement</option>
                        </Select>
                    </div>
                    <div className="flex justify-end pt-6 space-x-2">
                        <Button variant="secondary" onClick={closeModal}>Annuler</Button>
                        <Button onClick={handleSave}>Enregistrer</Button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default ProFormationManagement;