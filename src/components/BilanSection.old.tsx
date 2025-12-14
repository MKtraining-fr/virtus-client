/**
 * Composant pour afficher la section "Mes bilans" dans le profil client
 * Utilise useBilanAssignments pour charger les bilans depuis Supabase
 * 
 * Version: 1.0
 * Date: 2025-12-14
 */

import React, { useState, useMemo } from 'react';
import { useBilanAssignments } from '../hooks/useBilanAssignments';
import { BilanAssignment } from '../services/bilanAssignmentService';
import Button from './Button';
import Modal from './Modal';

interface BilanSectionProps {
  userId: string;
  theme?: 'light' | 'dark';
}

const BilanSection: React.FC<BilanSectionProps> = ({ userId, theme = 'light' }) => {
  const { assignments, loading, complete } = useBilanAssignments(userId, 'client');
  const [selectedBilan, setSelectedBilan] = useState<BilanAssignment | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  // Séparer les bilans actifs et complétés
  const activeBilans = useMemo(
    () => assignments.filter((a) => a.status === 'assigned'),
    [assignments]
  );

  const completedBilans = useMemo(
    () => assignments.filter((a) => a.status === 'completed'),
    [assignments]
  );

  const handleOpenBilan = (bilan: BilanAssignment) => {
    setSelectedBilan(bilan);
    if (bilan.status === 'assigned') {
      // Initialiser les réponses vides pour un nouveau bilan
      setAnswers({});
    } else {
      // Charger les réponses existantes pour un bilan complété
      setAnswers(bilan.data.answers || {});
    }
  };

  const handleCloseBilan = () => {
    setSelectedBilan(null);
    setAnswers({});
  };

  const handleAnswerChange = (fieldId: string, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleSubmitBilan = async () => {
    if (!selectedBilan) return;

    setIsCompleting(true);

    const success = await complete({
      assignmentId: selectedBilan.id,
      answers,
    });

    setIsCompleting(false);

    if (success) {
      alert('Bilan complété avec succès !');
      handleCloseBilan();
    } else {
      alert('Erreur lors de la complétion du bilan.');
    }
  };

  if (loading) {
    return <p className="text-client-subtle text-center py-4">Chargement des bilans...</p>;
  }

  if (assignments.length === 0) {
    return <p className="text-client-subtle text-center py-4">Aucun bilan assigné.</p>;
  }

  return (
    <>
      <div className="space-y-6">
        {/* Bilans actifs */}
        {activeBilans.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-client-light mb-3">Bilans en attente</h4>
            <div className="space-y-3">
              {activeBilans.map((bilan) => (
                <div
                  key={bilan.id}
                  className="flex flex-wrap justify-between items-center p-3 bg-client-dark rounded-lg border border-gray-700"
                >
                  <div>
                    <p className="font-semibold text-client-light">
                      {bilan.data.template_name}
                    </p>
                    <p className="text-sm text-client-subtle">
                      Assigné le: {new Date(bilan.assigned_at).toLocaleDateString('fr-FR')}
                      {bilan.frequency !== 'once' && (
                        <span className="ml-2 text-xs bg-yellow-600 text-white px-2 py-0.5 rounded">
                          {bilan.frequency === 'weekly'
                            ? 'Hebdomadaire'
                            : bilan.frequency === 'biweekly'
                            ? 'Bi-hebdomadaire'
                            : 'Mensuel'}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="mt-2 md:mt-0">
                    <Button size="sm" variant="secondary" onClick={() => handleOpenBilan(bilan)}>
                      Remplir le bilan
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bilans complétés */}
        {completedBilans.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-client-light mb-3">Bilans complétés</h4>
            <div className="space-y-3">
              {completedBilans.map((bilan) => (
                <div
                  key={bilan.id}
                  className="flex flex-wrap justify-between items-center p-3 bg-client-dark rounded-lg border border-gray-700"
                >
                  <div>
                    <p className="font-semibold text-client-light">
                      {bilan.data.template_name}
                    </p>
                    <p className="text-sm text-client-subtle">
                      Complété le:{' '}
                      {bilan.completed_at
                        ? new Date(bilan.completed_at).toLocaleDateString('fr-FR')
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="mt-2 md:mt-0">
                    <Button size="sm" variant="secondary" onClick={() => handleOpenBilan(bilan)}>
                      Consulter
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal de visualisation/complétion */}
      {selectedBilan && (
        <Modal
          isOpen={!!selectedBilan}
          onClose={handleCloseBilan}
          title={selectedBilan.data.template_name}
          theme={theme}
          size="xl"
        >
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
            {selectedBilan.data.template_snapshot.map((section: any) => {
              const answeredFields =
                selectedBilan.status === 'completed'
                  ? section.fields.filter((field: any) => {
                      const answer = answers[field.id];
                      return (
                        answer !== undefined &&
                        answer !== null &&
                        answer !== '' &&
                        (!Array.isArray(answer) || answer.length > 0)
                      );
                    })
                  : section.fields;

              if (answeredFields.length === 0) return null;

              return (
                <div key={section.id}>
                  <h4 className="font-semibold text-lg text-gray-800 dark:text-client-light mb-4 pt-4 border-t border-gray-200 dark:border-client-card first:pt-0 first:border-t-0">
                    {section.title}
                  </h4>
                  <div className="space-y-4">
                    {answeredFields.map((field: any) => {
                      const answer = answers[field.id];
                      const isReadOnly = selectedBilan.status === 'completed';

                      return (
                        <div
                          key={field.id}
                          className="py-2 border-b border-gray-200 dark:border-client-card last:border-b-0"
                        >
                          <label className="block text-sm font-medium text-gray-700 dark:text-client-light mb-2">
                            {field.label}
                          </label>

                          {isReadOnly ? (
                            // Affichage en lecture seule
                            <p className="text-gray-900 dark:text-client-light">
                              {Array.isArray(answer) ? answer.join(', ') : answer || 'N/A'}
                            </p>
                          ) : (
                            // Champs éditables pour remplir le bilan
                            <>
                              {field.type === 'text' && (
                                <input
                                  type="text"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-client-dark dark:border-gray-600 dark:text-client-light"
                                  value={answer || ''}
                                  onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                                  placeholder={field.placeholder}
                                />
                              )}
                              {field.type === 'textarea' && (
                                <textarea
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-client-dark dark:border-gray-600 dark:text-client-light"
                                  rows={4}
                                  value={answer || ''}
                                  onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                                  placeholder={field.placeholder}
                                />
                              )}
                              {field.type === 'number' && (
                                <input
                                  type="number"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-client-dark dark:border-gray-600 dark:text-client-light"
                                  value={answer || ''}
                                  onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                                  placeholder={field.placeholder}
                                />
                              )}
                              {field.type === 'select' && (
                                <select
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-client-dark dark:border-gray-600 dark:text-client-light"
                                  value={answer || ''}
                                  onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                                >
                                  <option value="">Sélectionnez une option</option>
                                  {field.options?.map((option: string) => (
                                    <option key={option} value={option}>
                                      {option}
                                    </option>
                                  ))}
                                </select>
                              )}
                              {field.type === 'checkbox' && (
                                <div className="space-y-2">
                                  {field.options?.map((option: string) => (
                                    <label key={option} className="flex items-center">
                                      <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded text-primary focus:ring-primary"
                                        checked={(answer || []).includes(option)}
                                        onChange={(e) => {
                                          const currentAnswers = answer || [];
                                          if (e.target.checked) {
                                            handleAnswerChange(field.id, [...currentAnswers, option]);
                                          } else {
                                            handleAnswerChange(
                                              field.id,
                                              currentAnswers.filter((a: string) => a !== option)
                                            );
                                          }
                                        }}
                                      />
                                      <span className="ml-2 text-sm text-gray-700 dark:text-client-light">
                                        {option}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              )}
                              {field.type === 'date' && (
                                <input
                                  type="date"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-client-dark dark:border-gray-600 dark:text-client-light"
                                  value={answer || ''}
                                  onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                                />
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bouton de soumission pour les bilans en attente */}
          {selectedBilan.status === 'assigned' && (
            <div className="pt-6 border-t border-gray-200 dark:border-client-card mt-6 flex justify-end space-x-2">
              <Button variant="secondary" onClick={handleCloseBilan}>
                Annuler
              </Button>
              <Button onClick={handleSubmitBilan} disabled={isCompleting}>
                {isCompleting ? 'Envoi en cours...' : 'Envoyer les réponses'}
              </Button>
            </div>
          )}
        </Modal>
      )}
    </>
  );
};

export default BilanSection;
