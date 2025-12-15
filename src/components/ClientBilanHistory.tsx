/**
 * Composant pour afficher l'historique des bilans d'un client (vue coach)
 * Permet de voir les réponses et de valider le bilan initial
 * 
 * Version: 1.0
 * Date: 2025-12-14
 */

import React, { useState, useEffect } from 'react';
import { getBilanAssignmentsForClient } from '../services/bilanAssignmentService';
import { validateInitialBilan } from '../services/bilanAssignmentService';
import { deleteBilanAssignment } from '../services/bilanAssignmentService';
import { BilanAssignment } from '../services/bilanAssignmentService';
import Button from './Button';
import Modal from './Modal';
import Card from './Card';

interface ClientBilanHistoryProps {
  clientId: string;
  coachId: string;
  clientStatus?: 'prospect' | 'active' | 'archived';
  refreshTrigger?: number;
}

const ClientBilanHistory: React.FC<ClientBilanHistoryProps> = ({
  clientId,
  coachId,
  clientStatus,
  refreshTrigger,
}) => {
  const [assignments, setAssignments] = useState<BilanAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBilan, setSelectedBilan] = useState<BilanAssignment | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadAssignments();
  }, [clientId, refreshTrigger]);

  const loadAssignments = async () => {
    setLoading(true);
    const data = await getBilanAssignmentsForClient(clientId);
    setAssignments(data);
    setLoading(false);
  };

  const handleValidateInitialBilan = async (assignmentId: string) => {
    if (
      !window.confirm(
        'Êtes-vous sûr de vouloir valider ce bilan initial et convertir le prospect en client actif ?'
      )
    ) {
      return;
    }

    setIsValidating(true);

    const result = await validateInitialBilan({
      assignmentId,
      coachId,
    });

    setIsValidating(false);

    if (result.success) {
      alert('Bilan initial validé avec succès ! Le client est maintenant actif.');
      setSelectedBilan(null);
      // Recharger la page pour mettre à jour le statut du client
      window.location.reload();
    } else {
      alert(`Erreur lors de la validation : ${result.error}`);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (
      !window.confirm(
        'Êtes-vous sûr de vouloir supprimer cette assignation ? Cette action est irréversible.'
      )
    ) {
      return;
    }

    setIsDeleting(assignmentId);

    const result = await deleteBilanAssignment({
      assignmentId,
      coachId,
    });

    setIsDeleting(null);

    if (result.success) {
      alert('Assignation supprimée avec succès.');
      // Recharger les assignations
      await loadAssignments();
    } else {
      alert(`Erreur lors de la suppression : ${result.error}`);
    }
  };

  if (loading) {
    return <p className="text-gray-500">Chargement de l'historique des bilans...</p>;
  }

  if (assignments.length === 0) {
    return <p className="text-gray-500">Aucun bilan assigné à ce client.</p>;
  }

  return (
    <>
      <div className="space-y-4">
        {assignments.map((bilan) => {
          const isInitialBilan =
            bilan.data.template_name === 'Bilan Initial' && clientStatus === 'prospect';

          return (
            <Card key={bilan.id} className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-grow">
                  <h4 className="font-semibold text-gray-900">{bilan.data.template_name}</h4>
                  <div className="text-sm text-gray-600 mt-1 space-y-1">
                    <p>
                      Assigné le: {new Date(bilan.assigned_at).toLocaleDateString('fr-FR')}
                    </p>
                    {bilan.scheduled_date && (
                      <p>
                        Date planifiée: {new Date(bilan.scheduled_date + 'T00:00:00').toLocaleDateString('fr-FR')}
                      </p>
                    )}
                    {bilan.completed_at && (
                      <p>
                        Complété le: {new Date(bilan.completed_at).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                    <p>
                      Statut:{' '}
                      <span
                        className={`font-medium ${
                          bilan.status === 'completed'
                            ? 'text-green-600'
                            : bilan.status === 'assigned'
                            ? 'text-yellow-600'
                            : 'text-gray-600'
                        }`}
                      >
                        {bilan.status === 'completed'
                          ? 'Complété'
                          : bilan.status === 'assigned'
                          ? 'En attente'
                          : 'Archivé'}
                      </span>
                    </p>
                    {bilan.frequency !== 'once' && (
                      <p className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded inline-block">
                        {bilan.frequency === 'weekly'
                          ? 'Récurrent hebdomadaire'
                          : bilan.frequency === 'biweekly'
                          ? 'Récurrent bi-hebdomadaire'
                          : 'Récurrent mensuel'}
                      </p>
                    )}
                  </div>
                </div>
                <div className="ml-4 flex items-center space-x-2">
                  {bilan.status === 'completed' && (
                    <>
                      <Button size="sm" variant="secondary" onClick={() => setSelectedBilan(bilan)}>
                        Voir les réponses
                      </Button>
                      {isInitialBilan && (
                        <Button
                          size="sm"
                          onClick={() => handleValidateInitialBilan(bilan.id)}
                          disabled={isValidating}
                        >
                          {isValidating ? 'Validation...' : 'Valider le client'}
                        </Button>
                      )}
                    </>
                  )}
                  {bilan.status === 'assigned' && (
                    <span className="text-sm text-gray-500">En attente de réponse</span>
                  )}
                  {/* Bouton supprimer pour toutes les assignations */}
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDeleteAssignment(bilan.id)}
                    disabled={isDeleting === bilan.id}
                  >
                    {isDeleting === bilan.id ? 'Suppression...' : 'Supprimer'}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Modal de visualisation des réponses */}
      {selectedBilan && (
        <Modal
          isOpen={!!selectedBilan}
          onClose={() => setSelectedBilan(null)}
          title={`Réponses - ${selectedBilan.data.template_name}`}
          size="xl"
        >
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
            {selectedBilan.data.template_snapshot.map((section: any) => {
              const answeredFields = section.fields.filter((field: any) => {
                const answer = selectedBilan.data.answers?.[field.id];
                return (
                  answer !== undefined &&
                  answer !== null &&
                  answer !== '' &&
                  (!Array.isArray(answer) || answer.length > 0)
                );
              });

              if (answeredFields.length === 0) return null;

              return (
                <div key={section.id}>
                  <h4 className="font-semibold text-lg text-gray-800 mb-4 pt-4 border-t border-gray-200 first:pt-0 first:border-t-0">
                    {section.title}
                  </h4>
                  <div className="space-y-3">
                    {answeredFields.map((field: any) => {
                      const answer = selectedBilan.data.answers[field.id];
                      return (
                        <div
                          key={field.id}
                          className="py-2 border-b border-gray-200 last:border-b-0"
                        >
                          <p className="text-sm font-medium text-gray-700 mb-1">{field.label}</p>
                          <p className="text-gray-900">
                            {Array.isArray(answer) ? answer.join(', ') : answer}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bouton de validation pour le bilan initial */}
          {selectedBilan.data.template_name === 'Bilan Initial' && clientStatus === 'prospect' && (
            <div className="pt-6 border-t border-gray-200 mt-6 flex justify-end space-x-2">
              <Button variant="secondary" onClick={() => setSelectedBilan(null)}>
                Fermer
              </Button>
              <Button
                onClick={() => handleValidateInitialBilan(selectedBilan.id)}
                disabled={isValidating}
              >
                {isValidating ? 'Validation en cours...' : 'Valider le client'}
              </Button>
            </div>
          )}
        </Modal>
      )}
    </>
  );
};

export default ClientBilanHistory;
