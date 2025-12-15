import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Client } from '../../types';
import Modal from '../Modal';
import Button from '../Button';
import Select from '../Select';
import { CalendarIcon } from '../../constants/icons';
import { useBilanTemplates } from '../../hooks/useBilanTemplates';
import { useBilanAssignments } from '../../hooks/useBilanAssignments';

interface BilanAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  onAssignmentSuccess?: () => void;
}

type FrequencyType = 'once' | 'weekly' | 'biweekly' | 'monthly';

const frequencyOptions: { value: FrequencyType; label: string }[] = [
  { value: 'once', label: 'Envoi unique' },
  { value: 'weekly', label: 'Hebdomadaire' },
  { value: 'biweekly', label: 'Toutes les 2 semaines' },
  { value: 'monthly', label: 'Mensuel' },
];

const BilanAssignmentModal: React.FC<BilanAssignmentModalProps> = ({ isOpen, onClose, client, onAssignmentSuccess }) => {
  const { user } = useAuth();
  const { templates, loading: templatesLoading } = useBilanTemplates(user?.id);
  const { assign, loading: assignLoading, error: assignError } = useBilanAssignments(user?.id, user?.role as 'coach' | 'client');
  
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [frequency, setFrequency] = useState<FrequencyType>('once');
  const [scheduledDate, setScheduledDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const handleAssign = async () => {
    if (!selectedTemplateId) {
      alert('Veuillez sélectionner un template de bilan.');
      return;
    }

    if (!user?.id) {
      alert('Erreur : Utilisateur non connecté.');
      return;
    }

    try {
      const success = await assign({
        templateId: selectedTemplateId,
        clientId: client.id,
        coachId: user.id,
        frequency,
        scheduledDate,
      });

      if (success) {
        alert(`Bilan assigné à ${client.firstName} ${client.lastName} avec succès !`);
        // Notifier le parent pour rafraîchir la liste
        if (onAssignmentSuccess) {
          onAssignmentSuccess();
        }
        onClose();
        // Réinitialiser les champs
        setSelectedTemplateId('');
        setFrequency('once');
        setScheduledDate(new Date().toISOString().split('T')[0]);
      } else {
        // Afficher l'erreur détaillée
        console.error('Erreur d\'assignation:', assignError);
        alert(`Erreur lors de l'assignation du bilan.\n\nDétails: ${assignError || 'Aucun détail disponible'}`);
      }
    } catch (error) {
      console.error('Erreur lors de l\'assignation:', error);
      alert(
        `Erreur lors de l'assignation : ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      );
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
          onChange={(value) => setSelectedTemplateId(value as string)}
          disabled={templatesLoading}
        >
          <option value="">-- Choisir un template --</option>
          {templates && templates.length > 0 ? (
            templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))
          ) : (
            !templatesLoading && <option value="" disabled>Aucun template disponible</option>
          )}
        </Select>

        <Select
          label="Fréquence d'envoi"
          value={frequency}
          onChange={(value) => setFrequency(value as FrequencyType)}
        >
          {frequencyOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date de première assignation
          </label>
          <input
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="secondary" onClick={onClose} disabled={assignLoading}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleAssign}
            disabled={!selectedTemplateId || assignLoading || templatesLoading}
            isLoading={assignLoading}
          >
            Assigner le Bilan
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default BilanAssignmentModal;
