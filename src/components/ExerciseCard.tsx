import React, { useState } from 'react';
import { Bars3Icon, TrashIcon, FolderIcon } from '@heroicons/react/24/outline';
import Input from './Input.tsx';
import Button from './Button.tsx';
import Select from './Select.tsx';
import { Exercise } from '../types.ts';
import { getExerciseDataForWeek, setExerciseDataForWeek } from '../utils/weekVariations.ts';

interface WorkoutExercise {
  id: number;
  exerciseId?: string;
  name: string;
  illustrationUrl?: string;
  sets: string;
  isDetailed: boolean;
  details: Array<{
    reps: string;
    load: { value: string; unit: string };
    tempo: string;
    rest: string;
  }>;
  intensification: Array<{ id: number; value: string }>;
  alternatives: Array<{ id: string; name: string }>;
  notes?: string;
}

interface ExerciseCardProps {
  exercise: WorkoutExercise;
  exerciseNumber: number;
  availableExercises: Exercise[];
  isSelected: boolean;
  isDragInteractionLocked: boolean;
  draggedOverExerciseId: number | null;
  exerciseDragItem: React.MutableRefObject<number | null>;
  totalWeeks?: number;
  onToggleSelection: (id: number) => void;
  onUpdateExercise: (id: number, field: string, value: any, setIndex?: number) => void;
  onDeleteExercise: (id: number) => void;
  onDragStart: (e: React.DragEvent, id: number) => void;
  onDragEnd: () => void;
  onDragEnter: (e: React.DragEvent, id: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onOpenHistory: () => void;
}

// Icône cercle de chargement (ArrowPath)
const ArrowPathIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
    />
  </svg>
);

// Icône XMark
const XMarkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

// Icône ChevronDown
const ChevronDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </svg>
);

const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise: ex,
  exerciseNumber,
  availableExercises,
  isSelected,
  isDragInteractionLocked,
  draggedOverExerciseId,
  exerciseDragItem,
  totalWeeks = 8,
  onToggleSelection,
  onUpdateExercise,
  onDeleteExercise,
  onDragStart,
  onDragEnd,
  onDragEnter,
  onDragOver,
  onOpenHistory,
}) => {
  const [isDetailedMode, setIsDetailedMode] = useState(false);
  const [showAlternativesModal, setShowAlternativesModal] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(1);

  // Récupérer les données de la semaine sélectionnée
  const weekData = getExerciseDataForWeek(ex as any, selectedWeek);

  const toggleDetailedMode = () => {
    if (!ex.sets || parseInt(ex.sets, 10) === 0) {
      alert('Veuillez spécifier le nombre de séries avant de passer en mode détaillé.');
      return;
    }
    setIsDetailedMode(!isDetailedMode);
  };

  // Valeurs du mode simple (première série ou valeurs par défaut)
  const simpleValues = weekData.details && weekData.details.length > 0 ? weekData.details[0] : {
    reps: '12',
    load: { value: '', unit: 'kg' },
    tempo: '2010',
    rest: '60s',
  };

  const handleSimpleValueChange = (field: string, value: any) => {
    // Mettre à jour toutes les séries de la semaine sélectionnée avec la même valeur
    if (weekData.details && weekData.details.length > 0) {
      const updatedDetails = weekData.details.map((detail: any) => {
        const fieldParts = field.split('.');
        if (fieldParts.length === 2) {
          // Champ imbriqué (ex: load.value)
          return {
            ...detail,
            [fieldParts[0]]: {
              ...detail[fieldParts[0]],
              [fieldParts[1]]: value,
            },
          };
        } else {
          // Champ simple (ex: reps, tempo, rest)
          return {
            ...detail,
            [field]: value,
          };
        }
      });
      handleWeekFieldChange('details', updatedDetails);
    }
  };

  // Fonction pour mettre à jour un champ de la semaine sélectionnée
  const handleWeekFieldChange = (field: string, value: any) => {
    const updatedExercise = setExerciseDataForWeek(ex as any, selectedWeek, field, value);
    onUpdateExercise(ex.id, 'weekVariations', updatedExercise.weekVariations);
  };

  return (
    <div
      key={ex.id}
      onDragEnter={(e) => onDragEnter(e, ex.id)}
      onDragOver={onDragOver}
      className="mb-4 flex gap-2"
    >
      {/* BOUTONS D'ACTION À GAUCHE (EXTERNES) */}
      <div className="flex flex-col gap-2">
        {/* Menu hamburger - Drag handle (toujours visible) */}
        <button
          type="button"
          draggable={!isDragInteractionLocked}
          onDragStart={(e) => onDragStart(e, ex.id)}
          onDragEnd={onDragEnd}
          className={`p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all ${
            isDragInteractionLocked ? 'cursor-not-allowed opacity-50' : 'cursor-grab active:cursor-grabbing'
          }`}
          onMouseDown={(e) => {
            if (isDragInteractionLocked) {
              e.preventDefault();
            }
          }}
          aria-label="Réordonner l'exercice"
          aria-disabled={isDragInteractionLocked}
          title="Maintenir pour réorganiser"
        >
          <Bars3Icon className="w-5 h-5" />
        </button>

        {/* Boutons visibles uniquement en mode étendu */}
        {!isCollapsed && (
          <>
            {/* Corbeille - Supprimer */}
            <button
              type="button"
              onClick={() => onDeleteExercise(ex.id)}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
              title="Supprimer l'exercice"
            >
              <TrashIcon className="w-5 h-5" />
            </button>

            {/* Historique */}
            {ex.exerciseId && (
              <button
                type="button"
                onClick={onOpenHistory}
                className="p-2 text-gray-600 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                title="Voir l'historique du client"
              >
                <FolderIcon className="w-5 h-5" />
              </button>
            )}

            {/* Cercle de chargement - Alternatives */}
            <button
              type="button"
              onClick={() => setShowAlternativesModal(!showAlternativesModal)}
              className={`p-2 rounded-lg transition-all ${
                (ex.alternatives ?? []).length > 0
                  ? 'text-primary bg-primary/15 hover:bg-primary/25'
                  : 'text-gray-600 hover:text-primary hover:bg-primary/10'
              }`}
              title="Gérer les mouvements alternatifs"
            >
              <ArrowPathIcon className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* BLOC PRINCIPAL */}
      <div className={`flex-1 border-2 rounded-lg overflow-hidden transition-all ${
        draggedOverExerciseId === ex.id ? 'border-primary shadow-lg' : 'border-primary/30'
      } ${exerciseDragItem.current === ex.id ? 'opacity-50' : ''}`}>
        <div className="flex">
          {/* PARTIE GAUCHE - Image (masquée en mode réduit) */}
          {!isCollapsed && (
            <div className="w-1/5 bg-white p-1.5 flex flex-col">
              {/* Numéro de l'exercice */}
              <div className="mb-1">
                <span className="text-xs font-semibold text-gray-700">
                  Exercice {exerciseNumber}
                </span>
              </div>

              {/* Image de l'exercice */}
              <div className="flex items-center justify-center">
                {ex.illustrationUrl ? (
                  <img
                    src={ex.illustrationUrl}
                    alt={ex.name}
                    className="w-full h-auto max-h-24 rounded object-contain"
                  />
                ) : (
                  <div className="w-full h-20 bg-gray-50 rounded flex items-center justify-center border-2 border-dashed border-gray-300">
                    <span className="text-gray-400 text-sm font-medium">Aucune image</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PARTIE DROITE - Formulaire */}
          <div className="flex-1 bg-primary/5 p-1.5">
            {/* Nom du mouvement avec flèche */}
            <div className="flex items-center justify-end mb-1.5 gap-1.5">
              <input
                type="text"
                placeholder="Nom du mouvement"
                value={ex.name}
                onChange={(e) => onUpdateExercise(ex.id, 'name', e.target.value)}
                className="flex-1 px-0 py-1 border-none bg-transparent focus:outline-none text-sm font-semibold text-gray-800 placeholder-gray-400 text-right"
              />
              <button
                type="button"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="text-gray-400 hover:text-gray-600 transition-all"
                title={isCollapsed ? "Étendre" : "Réduire"}
              >
                <ChevronDownIcon className={`w-5 h-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Sélecteur de semaine */}
            {!isCollapsed && totalWeeks > 1 && (
              <div className="flex gap-1 mb-2 overflow-x-auto pb-1">
                {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((week) => (
                  <button
                    key={week}
                    type="button"
                    onClick={() => setSelectedWeek(week)}
                    className={`px-2 py-0.5 text-xs rounded transition-all flex-shrink-0 ${
                      selectedWeek === week
                        ? 'bg-primary text-white font-semibold'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    S{week}
                  </button>
                ))}
              </div>
            )}

            {/* Formulaire (masqué si réduit) */}
            {!isCollapsed && (
              <>
                {/* Mode Simple ou Détaillé */}
                {!isDetailedMode ? (
                  /* MODE SIMPLE - Grille 2 colonnes */
                  <div className="grid grid-cols-2 gap-1.5">
                    {/* Colonne 1 */}
                    <div className="space-y-1.5">
                      {/* Série */}
                      <div className="flex items-center border-2 border-primary/20 rounded bg-white px-1.5 py-1 transition-all focus-within:border-primary/50">
                        <span className="text-xs text-gray-600 mr-auto">série</span>
                        <input
                          type="number"
                          value={weekData.sets}
                          onChange={(e) => handleWeekFieldChange('sets', e.target.value)}
                          className="w-16 bg-transparent border-none focus:outline-none text-sm text-right"
                        />
                        <button
                          type="button"
                          onClick={toggleDetailedMode}
                          className="ml-2 text-gray-400 hover:text-gray-600"
                          title="Mode détaillé"
                        >
                          <ChevronDownIcon className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Charge */}
                      <div className={`flex items-center border-2 border-primary/20 rounded bg-white px-1.5 py-1 transition-all focus-within:border-primary/50 ${isDetailedMode ? 'opacity-50' : ''}`}>
                        <span className="text-xs text-gray-600 mr-auto">Charge</span>
                        <input
                          type="text"
                          value={simpleValues.load.value}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || /^[0-9.,]*$/.test(value)) {
                              handleSimpleValueChange('load.value', value);
                            }
                          }}
                          disabled={isDetailedMode}
                          className="w-16 bg-transparent border-none focus:outline-none text-sm text-right disabled:cursor-not-allowed"
                          placeholder="80"
                        />
                        <select
                          value={simpleValues.load.unit}
                          onChange={(e) => handleSimpleValueChange('load.unit', e.target.value)}
                          disabled={isDetailedMode}
                          className="ml-2 px-2 py-1 bg-transparent border-none text-sm font-medium focus:outline-none disabled:cursor-not-allowed"
                        >
                          <option value="kg">kg</option>
                          <option value="lbs">lbs</option>
                          <option value="%">%</option>
                          <option value="@">@</option>
                        </select>
                      </div>

                      {/* Tempo */}
                      <div className="flex items-center border-2 border-primary/20 rounded bg-white px-1.5 py-1 transition-all focus-within:border-primary/50">
                        <span className="text-xs text-gray-600 mr-auto">Tempo</span>
                        <input
                          type="text"
                          value={simpleValues.tempo}
                          onChange={(e) => handleSimpleValueChange('tempo', e.target.value)}
                          className="w-16 bg-transparent border-none focus:outline-none text-sm text-right"
                          placeholder="2010"
                        />
                      </div>
                    </div>

                    {/* Colonne 2 */}
                    <div className="space-y-1.5">
                      {/* Répétitions */}
                      <div className={`flex items-center border-2 border-primary/20 rounded bg-white px-1.5 py-1 transition-all focus-within:border-primary/50 ${isDetailedMode ? 'opacity-50' : ''}`}>
                        <span className="text-xs text-gray-600 mr-auto">Répétitions</span>
                        <input
                          type="text"
                          value={simpleValues.reps}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || /^[0-9\s-]*$/.test(value)) {
                              handleSimpleValueChange('reps', value);
                            }
                          }}
                          disabled={isDetailedMode}
                          className="w-16 bg-transparent border-none focus:outline-none text-sm text-right disabled:cursor-not-allowed"
                          placeholder="12"
                        />
                      </div>

                      {/* Élément d'intensification */}
                      <div className="relative">
                        <select
                          value={weekData.intensification && weekData.intensification.length > 0 ? weekData.intensification[0].value : 'Aucune'}
                          onChange={(e) => handleWeekFieldChange('intensification', e.target.value === 'Aucune' ? [] : [{ id: 1, value: e.target.value }])}
                          className="w-full px-3 py-2 border-2 border-primary/20 rounded-xl bg-white text-sm focus:outline-none focus:border-primary/50 appearance-none"
                        >
                          <option value="Aucune">Élément d'intensification</option>
                          <option value="Dégressif">Dégressif</option>
                          <option value="Superset">Superset</option>
                          <option value="Dropset">Dropset</option>
                          <option value="Rest-Pause">Rest-Pause</option>
                          <option value="Myo-reps">Myo-reps</option>
                          <option value="Cluster">Cluster</option>
                          <option value="Partielles">Partielles</option>
                          <option value="Tempo">Tempo</option>
                          <option value="Isometric">Isometric</option>
                        </select>
                        <ChevronDownIcon className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>

                      {/* Repos */}
                      <div className="flex items-center border-2 border-primary/20 rounded bg-white px-1.5 py-1 transition-all focus-within:border-primary/50">
                        <span className="text-xs text-gray-600 mr-auto">Repos</span>
                        <input
                          type="text"
                          value={simpleValues.rest}
                          onChange={(e) => handleSimpleValueChange('rest', e.target.value)}
                          className="w-16 bg-transparent border-none focus:outline-none text-sm text-right"
                          placeholder="60s"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* MODE DÉTAILLÉ */
                  <div className="space-y-1.5">
                    <div className="border-2 border-primary/20 rounded p-1.5 bg-white">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700 mb-1.5">
                        <span>Série détaillée</span>
                        <button
                          type="button"
                          onClick={toggleDetailedMode}
                          className="p-1 rounded-full hover:bg-primary/10 text-primary"
                          title="Revenir en mode simple"
                        >
                          <Bars3Icon className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-5 gap-1.5 text-xs font-medium text-gray-700 mb-1.5">
                        <span>#</span>
                        <span>Reps</span>
                        <span>Charge</span>
                        <span>Tempo</span>
                        <span>Repos</span>
                      </div>
                      {(weekData.details ?? []).map((detail, detailIndex) => (
                        <div key={detailIndex} className="grid grid-cols-5 gap-1.5 mb-1.5">
                          <div className="flex items-center font-semibold text-gray-800">
                            #{detailIndex + 1}
                          </div>
                          <Input
                            type="text"
                            value={detail.reps}
                            onChange={(e) => {
                              const updatedDetails = [...(weekData.details ?? [])];
                              updatedDetails[detailIndex] = { ...updatedDetails[detailIndex], reps: e.target.value };
                              handleWeekFieldChange('details', updatedDetails);
                            }}
                            placeholder="12"
                            className="border-2 border-primary/20 rounded-xl focus:border-primary/50"
                          />
                          <div className="flex flex-col gap-1">
                            <div className="flex gap-1">
                              <Input
                                type="text"
                                value={detail.load.value}
                                onChange={(e) => {
                                  const updatedDetails = [...(weekData.details ?? [])];
                                  updatedDetails[detailIndex] = {
                                    ...updatedDetails[detailIndex],
                                    load: { ...updatedDetails[detailIndex].load, value: e.target.value }
                                  };
                                  handleWeekFieldChange('details', updatedDetails);
                                }}
                                placeholder="80"
                                className="w-16 border-2 border-primary/20 rounded-xl focus:border-primary/50"
                              />
                              <Select
                                value={detail.load.unit}
                                onChange={(value) => {
                                  const updatedDetails = [...(weekData.details ?? [])];
                                  updatedDetails[detailIndex] = {
                                    ...updatedDetails[detailIndex],
                                    load: { ...updatedDetails[detailIndex].load, unit: value as any }
                                  };
                                  handleWeekFieldChange('details', updatedDetails);
                                }}
                                className="w-16 border-2 border-primary/20 rounded-xl focus:border-primary/50"
                              >
                                <option value="kg">kg</option>
                                <option value="lbs">lbs</option>
                                <option value="%">%</option>
                                <option value="@">@</option>
                              </Select>
                            </div>
                            {detail.load.unit === '%' && (
                              <div className="text-xs text-gray-500 italic">
                                💡 Calculé depuis l'historique du client
                              </div>
                            )}
                          </div>
                          <Input
                            type="text"
                            value={detail.tempo}
                            onChange={(e) => {
                              const updatedDetails = [...(weekData.details ?? [])];
                              updatedDetails[detailIndex] = { ...updatedDetails[detailIndex], tempo: e.target.value };
                              handleWeekFieldChange('details', updatedDetails);
                            }}
                            placeholder="2010"
                            className="border-2 border-primary/20 rounded-xl focus:border-primary/50"
                          />
                          <Input
                            type="text"
                            value={detail.rest}
                            onChange={(e) => {
                              const updatedDetails = [...(weekData.details ?? [])];
                              updatedDetails[detailIndex] = { ...updatedDetails[detailIndex], rest: e.target.value };
                              handleWeekFieldChange('details', updatedDetails);
                            }}
                            placeholder="60s"
                            className="border-2 border-primary/20 rounded-xl focus:border-primary/50"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes explicatives */}
                <div className="mt-1.5">
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">
                    Notes / Explications
                  </label>
                  <textarea
                    value={weekData.notes || ''}
                    onChange={(e) => handleWeekFieldChange('notes', e.target.value)}
                    placeholder="Notes pour le client..." 
                    className="w-full px-1.5 py-1 border-2 border-primary/20 rounded bg-white text-xs focus:outline-none focus:border-primary/50 resize-none"
                    rows={2}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal des alternatives */}
      {showAlternativesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-700">Mouvements alternatifs</h4>
              <button
                type="button"
                onClick={() => setShowAlternativesModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded-lg transition-all"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Sélectionnez des exercices alternatifs pour ce mouvement.
            </p>
            {/* Liste des alternatives à implémenter */}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseCard;
