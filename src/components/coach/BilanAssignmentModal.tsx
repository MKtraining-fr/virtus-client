import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Client, BilanAssignment } from '../../types';
import Modal from '../Modal';
import Button from '../Button';
import Select from '../Select';
import Input from '../Input';
import { CalendarIcon } from '../../constants/icons';

interface BilanAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    client: Client;
}

// J'ai ajouté 'quarterly' aux options, même s'il n'était pas dans le type BilanAssignment, car il est pertinent pour la récurrence.
// Je vais le laisser dans les options pour l'interface utilisateur.
const recurrenceOptions: { value: BilanAssignment['recurrence'], label: string }[] = [
    { value: undefined, label: 'Une seule fois' },
    { value: 'weekly', label: 'Hebdomadaire' },
    { value: 'monthly', label: 'Mensuelle' },
    { value: 'quarterly', label: 'Trimestrielle' },
    { value: 'yearly', label: 'Annuelle' },
];

const BilanAssignmentModal: React.FC<BilanAssignmentModalProps> = ({ isOpen, onClose, client }) => {
    const { bilanTemplates, assignBilanTemplate, user } = useAuth();
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [recurrence, setRecurrence] = useState<BilanAssignment['recurrence']>(undefined);
    const [isAssigning, setIsAssigning] = useState(false);

    const coachTemplates = useMemo(() => 
        bilanTemplates.filter(t => t.coachId === 'system' || t.coachId === user?.id), 
    [bilanTemplates, user]);

    const handleAssign = async () => {
        if (!selectedTemplateId) {
            alert("Veuillez sélectionner un template de bilan.");
            return;
        }

        setIsAssigning(true);
        try {
            await assignBilanTemplate(client.id, selectedTemplateId, recurrence);
            alert(`Bilan assigné à ${client.firstName} ${client.lastName} avec succès !`);
            onClose();
        } catch (error) {
            alert(`Erreur lors de l'assignation : ${error instanceof Error ? error.message : "Erreur inconnue"}`);
        } finally {
            setIsAssigning(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Assigner un Bilan à ${client.firstName} ${client.lastName}`}
        >
            <div className="space-y-4">
                <Select
                    label="Sélectionner le Template de Bilan"
                    value={selectedTemplateId}
                    onChange={e => setSelectedTemplateId(e.target.value)}
                >
                    <option value="">-- Choisir un template --</option>
                    {coachTemplates.map(template => (
                        <option key={template.id} value={template.id}>
                            {template.name} {template.coachId === 'system' && '(Système)'}
                        </option>
                    ))}
                </Select>

                <Select
                    label="Récurrence"
                    value={recurrence || ''}
                    onChange={e => setRecurrence(e.target.value as BilanAssignment['recurrence'])}
                    icon={<CalendarIcon className="w-5 h-5" />}
                >
                    {recurrenceOptions.map(option => (
                        <option key={option.value || 'once'} value={option.value || ''}>
                            {option.label}
                        </option>
                    ))}
                </Select>
                
                {/* Note: L'implémentation de la récurrence côté backend (Supabase) est supposée être gérée par une fonction ou un cronjob */}

                <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="secondary" onClick={onClose}>
                        Annuler
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={handleAssign} 
                        disabled={!selectedTemplateId || isAssigning}
                        isLoading={isAssigning}
                    >
                        Assigner le Bilan
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default BilanAssignmentModal;
