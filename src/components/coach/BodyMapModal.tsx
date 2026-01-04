/**
 * BodyMapModal - Modale de sélection des zones corporelles pour les blessures et douleurs
 * 
 * Utilise AnatomyViewer avec les SVG détaillés par muscle pour permettre
 * une sélection précise des zones de blessure.
 * 
 * Version responsive avec onglets pour mobile/PWA
 * 
 * @version 4.0.0
 * @date 2025-01-04
 */

import React, { useState, useCallback, useMemo } from 'react';
import Modal from '../Modal';
import Button from '../Button';
import Input from '../Input';
import Select from '../Select';
import AnatomyViewer from './AnatomyViewer';
import { 
  InjuryData, 
  BodyPart, 
  InjuryType, 
  InjurySeverity, 
  InjuryStatus 
} from '../../types';
import { MuscleDefinition, MUSCLE_GROUPS, getMuscleById } from '../../data/muscleConfig';
import { v4 as uuidv4 } from 'uuid';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface BodyMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  injuries: InjuryData[];
  onSave: (injuries: InjuryData[]) => void;
  theme?: 'light' | 'dark';
}

// Labels français pour les types de blessures
const INJURY_TYPE_LABELS: Record<InjuryType, string> = {
  'injury': 'Blessure',
  'chronic_pain': 'Douleur chronique',
  'surgery': 'Chirurgie/Opération',
  'limitation': 'Limitation fonctionnelle',
};

// Labels français pour la sévérité
const SEVERITY_LABELS: Record<InjurySeverity, string> = {
  'mild': 'Légère',
  'moderate': 'Modérée',
  'severe': 'Sévère',
};

// Labels français pour le statut
const STATUS_LABELS: Record<InjuryStatus, string> = {
  'active': 'Active',
  'recovering': 'En récupération',
  'healed': 'Guérie',
  'chronic': 'Chronique',
};

// Couleurs pour la sévérité
const SEVERITY_COLORS: Record<InjurySeverity, string> = {
  'mild': '#FCD34D', // Jaune
  'moderate': '#FB923C', // Orange
  'severe': '#EF4444', // Rouge
};

const BodyMapModal: React.FC<BodyMapModalProps> = ({
  isOpen,
  onClose,
  injuries,
  onSave,
  theme = 'dark',
}) => {
  // État local des blessures
  const [localInjuries, setLocalInjuries] = useState<InjuryData[]>(injuries);
  
  // Muscle sélectionné pour ajouter/modifier une blessure
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleDefinition | null>(null);
  
  // Modale de détail de blessure
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // Onglet actif pour mobile (0 = corps, 1 = liste)
  const [activeTab, setActiveTab] = useState(0);
  
  // État pour mettre en surbrillance la liste des muscles (pour guider l'utilisateur)
  const [highlightMuscleList, setHighlightMuscleList] = useState(false);
  
  // Formulaire de nouvelle blessure
  const [newInjury, setNewInjury] = useState<Partial<InjuryData>>({
    type: 'injury',
    severity: 'mild',
    status: 'active',
    description: '',
    notes: '',
  });

  // Synchroniser avec les props quand la modale s'ouvre
  React.useEffect(() => {
    if (isOpen) {
      setLocalInjuries(injuries);
      setActiveTab(0); // Commencer par le corps
    }
  }, [isOpen, injuries]);

  // Gérer la sélection d'un muscle
  const handleMuscleSelect = useCallback((muscle: MuscleDefinition) => {
    setSelectedMuscle(muscle);
    setNewInjury({
      type: 'injury',
      severity: 'mild',
      status: 'active',
      description: '',
      notes: '',
    });
    setIsDetailModalOpen(true);
  }, []);

  // Ajouter une blessure
  const handleAddInjury = useCallback(() => {
    if (!selectedMuscle || !newInjury.description?.trim()) return;

    const injury: InjuryData = {
      id: uuidv4(),
      bodyPart: selectedMuscle.id as BodyPart,
      type: newInjury.type as InjuryType,
      description: newInjury.description,
      severity: newInjury.severity as InjurySeverity,
      status: newInjury.status as InjuryStatus,
      since: newInjury.since,
      notes: newInjury.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setLocalInjuries((prev) => [...prev, injury]);
    setIsDetailModalOpen(false);
    setSelectedMuscle(null);
    setNewInjury({
      type: 'injury',
      severity: 'mild',
      status: 'active',
      description: '',
      notes: '',
    });
    // Sur mobile, basculer vers la liste après ajout
    setActiveTab(1);
  }, [selectedMuscle, newInjury]);

  // Supprimer une blessure
  const handleDeleteInjury = useCallback((injuryId: string) => {
    setLocalInjuries((prev) => prev.filter((i) => i.id !== injuryId));
  }, []);

  // Sauvegarder et fermer
  const handleSave = useCallback(() => {
    onSave(localInjuries);
    onClose();
  }, [localInjuries, onSave, onClose]);

  // Blessures du muscle sélectionné
  const selectedMuscleInjuries = useMemo(() => {
    if (!selectedMuscle) return [];
    return localInjuries.filter((i) => i.bodyPart === selectedMuscle.id);
  }, [selectedMuscle, localInjuries]);

  // IDs des muscles blessés pour le surlignage
  const injuredMuscleIds = useMemo(() => {
    return localInjuries.map(inj => inj.bodyPart);
  }, [localInjuries]);

  // Obtenir le nom du muscle à partir de l'ID de blessure
  const getMuscleNameFromInjury = (bodyPart: string): string => {
    const muscle = getMuscleById(bodyPart);
    if (muscle) return muscle.nameFr;
    return bodyPart;
  };

  const isDark = theme === 'dark';
  const bgClass = isDark ? 'bg-client-dark' : 'bg-gray-50';
  const textClass = isDark ? 'text-client-light' : 'text-gray-800';
  const cardClass = isDark ? 'bg-client-card border-client-dark' : 'bg-white border-gray-200';

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Blessures et Douleurs Chroniques"
        size="full"
        theme={theme}
      >
        <div className={`flex flex-col ${textClass}`} style={{ height: 'calc(100vh - 120px)', maxHeight: '780px' }}>
          {/* Onglets pour mobile */}
          <div className={`md:hidden flex border-b flex-shrink-0 ${isDark ? 'border-client-dark' : 'border-gray-200'}`}>
            <button
              onClick={() => setActiveTab(0)}
              className={`flex-1 py-3 text-center font-medium text-sm transition-colors ${
                activeTab === 0
                  ? isDark
                    ? 'border-b-2 border-primary text-primary'
                    : 'border-b-2 border-primary text-primary'
                  : isDark
                    ? 'text-client-subtle'
                    : 'text-gray-500'
              }`}
            >
              🏃 Sélectionner zone
            </button>
            <button
              onClick={() => setActiveTab(1)}
              className={`flex-1 py-3 text-center font-medium text-sm transition-colors ${
                activeTab === 1
                  ? isDark
                    ? 'border-b-2 border-primary text-primary'
                    : 'border-b-2 border-primary text-primary'
                  : isDark
                    ? 'text-client-subtle'
                    : 'text-gray-500'
              }`}
            >
              📋 Blessures ({localInjuries.length})
            </button>
          </div>

          {/* Instructions - visible uniquement sur desktop */}
          <div className={`hidden md:block p-3 border-b flex-shrink-0 ${isDark ? 'border-client-dark' : 'border-gray-200'}`}>
            <p className={`text-sm ${isDark ? 'text-client-subtle' : 'text-gray-600'}`}>
              Sélectionnez un muscle dans la liste à gauche ou recherchez-le pour ajouter une blessure ou douleur chronique.
            </p>
          </div>

          {/* Contenu principal */}
          <div className="flex flex-1 overflow-hidden min-h-0">
            {/* Visualiseur anatomique - visible sur desktop ou onglet 0 sur mobile */}
            <div className={`flex-1 overflow-hidden h-full ${activeTab === 0 ? 'block' : 'hidden md:block'} ${highlightMuscleList ? 'ring-2 ring-primary ring-offset-2 rounded-lg' : ''}`}>
              <AnatomyViewer
                onMuscleSelect={handleMuscleSelect}
                selectedMuscleIds={injuredMuscleIds}
                isMobile={true}
                highlightList={highlightMuscleList}
              />
            </div>

            {/* Panneau latéral - Liste des blessures - visible sur desktop ou onglet 1 sur mobile */}
            <div className={`w-full md:w-80 border-l ${isDark ? 'border-client-dark bg-client-card' : 'border-gray-200 bg-white'} overflow-y-auto flex-shrink-0 ${activeTab === 1 ? 'block' : 'hidden md:block'}`}>
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-4">
                  Blessures enregistrées ({localInjuries.length})
                </h3>
                
                {localInjuries.length === 0 ? (
                  <div className="text-center py-8">
                    <p className={`text-sm ${isDark ? 'text-client-subtle' : 'text-gray-500'}`}>
                      Aucune blessure enregistrée.
                    </p>
                    <p className={`text-xs mt-2 ${isDark ? 'text-client-subtle' : 'text-gray-400'}`}>
                      {activeTab === 1 ? (
                        <>Allez sur l'onglet "Sélectionner zone" pour ajouter une blessure.</>
                      ) : (
                        <>Sélectionnez un muscle dans la liste pour en ajouter.</>
                      )}
                    </p>
                    {activeTab === 1 && (
                      <button
                        onClick={() => setActiveTab(0)}
                        className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm md:hidden"
                      >
                        Sélectionner une zone
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Bouton pour ajouter une nouvelle blessure - visible sur toutes les tailles */}
                    <button
                      onClick={() => {
                        // Sur mobile, basculer vers l'onglet du corps
                        setActiveTab(0);
                        // Sur desktop, mettre en surbrillance la liste des muscles
                        setHighlightMuscleList(true);
                        setTimeout(() => setHighlightMuscleList(false), 3000);
                      }}
                      className={`w-full py-3 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 border-2 border-dashed ${
                        isDark 
                          ? 'border-primary/50 text-primary hover:bg-primary/10 hover:border-primary' 
                          : 'border-primary/50 text-primary hover:bg-primary/5 hover:border-primary'
                      }`}
                    >
                      <PlusIcon className="w-5 h-5" />
                      Ajouter une nouvelle blessure
                    </button>
                    
                    {/* Message d'aide quand le highlight est actif */}
                    {highlightMuscleList && (
                      <div className={`p-3 rounded-lg text-sm animate-pulse ${
                        isDark ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'
                      }`}>
                        ← Sélectionnez un muscle dans la liste à gauche ou cliquez sur le corps
                      </div>
                    )}
                    
                    {localInjuries.map((injury) => (
                      <div
                        key={injury.id}
                        className={`p-3 rounded-lg border ${cardClass}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: SEVERITY_COLORS[injury.severity] }}
                              />
                              <span className="font-medium text-sm">
                                {getMuscleNameFromInjury(injury.bodyPart)}
                              </span>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded inline-block mb-2 ${
                              isDark ? 'bg-client-dark' : 'bg-gray-100'
                            }`}>
                              {INJURY_TYPE_LABELS[injury.type]}
                            </span>
                            <p className={`text-sm ${isDark ? 'text-client-subtle' : 'text-gray-600'}`}>
                              {injury.description}
                            </p>
                            <div className={`text-xs mt-2 ${isDark ? 'text-client-subtle' : 'text-gray-500'}`}>
                              {SEVERITY_LABELS[injury.severity]} • {STATUS_LABELS[injury.status]}
                              {injury.since && (
                                <span className="block mt-1">
                                  Depuis {new Date(injury.since).toLocaleDateString('fr-FR')}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteInjury(injury.id)}
                            className="p-1 text-red-500 hover:text-red-700 flex-shrink-0"
                            title="Supprimer"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Boutons d'action - toujours visibles */}
          <div className={`flex justify-between md:justify-end gap-3 p-3 border-t flex-shrink-0 ${isDark ? 'border-client-dark' : 'border-gray-200'}`}>
            <Button variant="secondary" onClick={onClose} className="flex-1 md:flex-none">
              Annuler
            </Button>
            <Button variant="primary" onClick={handleSave} className="flex-1 md:flex-none">
              Enregistrer ({localInjuries.length})
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modale de détail pour ajouter une blessure */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Ajouter une blessure - ${selectedMuscle?.nameFr || ''}`}
        size="md"
        theme={theme}
        zIndex={60}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Blessures existantes pour ce muscle */}
          {selectedMuscleInjuries.length > 0 && (
            <div className={`p-3 rounded-lg ${bgClass}`}>
              <h4 className="font-medium mb-2">Blessures existantes sur ce muscle :</h4>
              <ul className="space-y-2">
                {selectedMuscleInjuries.map((inj) => (
                  <li key={inj.id} className="flex justify-between items-center text-sm">
                    <span>
                      <span
                        className="inline-block w-2 h-2 rounded-full mr-2"
                        style={{ backgroundColor: SEVERITY_COLORS[inj.severity] }}
                      />
                      {inj.description}
                    </span>
                    <button
                      onClick={() => handleDeleteInjury(inj.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Formulaire nouvelle blessure */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <PlusIcon className="w-5 h-5" />
              Nouvelle blessure
            </h4>

            <Select
              label="Type"
              value={newInjury.type || 'injury'}
              onChange={(value) => setNewInjury((prev) => ({ ...prev, type: value as InjuryType }))}
            >
              {Object.entries(INJURY_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>

            <Input
              label="Description"
              placeholder="Décrivez la blessure ou douleur..."
              value={newInjury.description || ''}
              onChange={(e) => setNewInjury((prev) => ({ ...prev, description: e.target.value }))}
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Sévérité"
                value={newInjury.severity || 'mild'}
                onChange={(value) => setNewInjury((prev) => ({ ...prev, severity: value as InjurySeverity }))}
              >
                {Object.entries(SEVERITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>

              <Select
                label="Statut"
                value={newInjury.status || 'active'}
                onChange={(value) => setNewInjury((prev) => ({ ...prev, status: value as InjuryStatus }))}
              >
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </div>

            <Input
              label="Depuis quand ? (optionnel)"
              type="date"
              value={newInjury.since || ''}
              onChange={(e) => setNewInjury((prev) => ({ ...prev, since: e.target.value }))}
            />

            <div>
              <label className={`block text-sm font-medium mb-1 ${textClass}`}>
                Notes additionnelles (optionnel)
              </label>
              <textarea
                className={`w-full px-3 py-2 border rounded-md ${
                  isDark
                    ? 'bg-client-dark border-client-dark text-client-light'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                rows={3}
                placeholder="Informations complémentaires..."
                value={newInjury.notes || ''}
                onChange={(e) => setNewInjury((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>

          {/* Boutons */}
          <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-inherit pb-2">
            <Button variant="secondary" onClick={() => setIsDetailModalOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handleAddInjury}
              disabled={!newInjury.description?.trim()}
            >
              Ajouter
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default BodyMapModal;
