import React, { useState } from 'react';
import { Bars3Icon, TrashIcon, FolderIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import Input from './Input.tsx';
import Button from './Button.tsx';
import Select from './Select.tsx';
import { Exercise } from '../types.ts';

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
  availableExercises: Exercise[];
  isSelected: boolean;
  isDragInteractionLocked: boolean;
  draggedOverExerciseId: number | null;
  exerciseDragItem: React.MutableRefObject<number | null>;
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

// Icône X pour fermer
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

// Icône chevron bas pour les dropdowns
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
  availableExercises,
  isSelected,
  isDragInteractionLocked,
  draggedOverExerciseId,
  exerciseDragItem,
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

  const toggleDetailedMode = () => {
    if (!ex.sets || parseInt(ex.sets, 10) === 0) {
      alert('Veuillez spécifier le nombre de séries avant de passer en mode détaillé.');
      return;
    }
    setIsDetailedMode(!isDetailedMode);
  };

  // Valeurs du mode simple (première série ou valeurs par défaut)
  const simpleValues = ex.details && ex.details.length > 0 ? ex.details[0] : {
    reps: '12',
    load: { value: '', unit: 'kg' },
    tempo: '2010',
    rest: '60s',
  };

  const handleSimpleValueChange = (field: string, value: any) => {
    // Mettre à jour toutes les séries avec la même valeur
    if (ex.details && ex.details.length > 0) {
      ex.details.forEach((_, index) => {
        onUpdateExercise(ex.id, field, value, index);
      });
    } else {
      // Créer la première série
      onUpdateExercise(ex.id, field, value, 0);
    }
  };

  return (
    <div
      key={ex.id}
      onDragEnter={(e) => onDragEnter(e, ex.id)}
      onDragOver={onDragOver}
      className={`mb-6 border-2 rounded-3xl bg-white overflow-hidden transition-all ${
        draggedOverExerciseId === ex.id ? 'border-primary shadow-lg' : 'border-primary/20'
      } ${exerciseDragItem.current === ex.id ? 'opacity-50' : ''}`}
    >
      <div className="flex">
        {/* PARTIE GAUCHE - Section Visuelle */}
        <div className="w-2/5 bg-gradient-to-br from-gray-50 to-gray-100 p-6 flex flex-col">
          {/* Boutons d'action */}
          <div className="flex items-center gap-2 mb-6">
            {/* Menu hamburger - Drag handle */}
            <button
              type="button"
              draggable={!isDragInteractionLocked}
              onDragStart={(e) => onDragStart(e, ex.id)}
              onDragEnd={onDragEnd}
              className={`p-2 text-gray-600 hover:text-gray-800 hover:bg-white/50 rounded-lg transition-all ${
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
              <Bars3Icon className="w-6 h-6" />
            </button>

            {/* Corbeille - Supprimer */}
            <button
              type="button"
              onClick={() => onDeleteExercise(ex.id)}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
              title="Supprimer l'exercice"
            >
              <TrashIcon className="w-6 h-6" />
            </button>

            {/* Historique */}
            {ex.exerciseId && (
              <button
                type="button"
                onClick={onOpenHistory}
                className="p-2 text-gray-600 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                title="Voir l'historique du client"
              >
                <FolderIcon className="w-6 h-6" />
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
              <ArrowPathIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Image de l'exercice */}
          <div className="flex-1 flex items-center justify-center">
            {ex.illustrationUrl ? (
              <img
                src={ex.illustrationUrl}
                alt={ex.name}
                className="w-full h-auto rounded-2xl object-cover shadow-md"
              />
            ) : (
              <div className="w-full aspect-[4/3] bg-white/50 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-300">
                <span className="text-gray-400 text-sm font-medium">Aucune image</span>
              </div>
            )}
          </div>
        </div>

        {/* PARTIE DROITE - Formulaire Vertical */}
        <div className="flex-1 p-6">
          {/* Nom du mouvement */}
          <div className="mb-3">
            <input
              type="text"
              placeholder="Nom du mouvement"
              value={ex.name}
              onChange={(e) => onUpdateExercise(ex.id, 'name', e.target.value)}
              className="w-full px-5 py-3 border-2 border-primary/20 rounded-2xl bg-white focus:outline-none focus:ring-0 focus:border-primary/50 placeholder-gray-400 text-base transition-all"
            />
          </div>

          {/* Mode Simple ou Détaillé */}
          {!isDetailedMode ? (
            /* MODE SIMPLE */
            <div className="space-y-3">
              {/* Série */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="série"
                      value={ex.sets ? `série` : ''}
                      readOnly
                      className="w-full px-5 py-3 border-2 border-primary/20 rounded-2xl bg-white text-base cursor-pointer"
                      onClick={toggleDetailedMode}
                    />
                    <ChevronDownIcon className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <Input
                    type="number"
                    value={ex.sets}
                    onChange={(e) => onUpdateExercise(ex.id, 'sets', e.target.value)}
                    placeholder=""
                    className="w-full px-5 py-3 border-2 border-primary/20 rounded-2xl focus:border-primary/50"
                  />
                </div>
              </div>

              {/* Répétitions */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="text"
                    value="Répétitions"
                    readOnly
                    className="w-full px-5 py-3 border-2 border-primary/20 rounded-2xl bg-white text-base"
                  />
                </div>
                <div>
                  <Input
                    type="text"
                    value={simpleValues.reps}
                    onChange={(e) => handleSimpleValueChange('reps', e.target.value)}
                    placeholder=""
                    className="w-full px-5 py-3 border-2 border-primary/20 rounded-2xl focus:border-primary/50"
                  />
                </div>
              </div>

              {/* Charge */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="text"
                    value="Charge"
                    readOnly
                    className="w-full px-5 py-3 border-2 border-primary/20 rounded-2xl bg-white text-base"
                  />
                </div>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={simpleValues.load.value}
                    onChange={(e) => handleSimpleValueChange('load.value', e.target.value)}
                    placeholder=""
                    className="flex-1 px-5 py-3 border-2 border-primary/20 rounded-2xl focus:border-primary/50"
                  />
                  <div className="relative">
                    <select
                      value={simpleValues.load.unit}
                      onChange={(e) => handleSimpleValueChange('load.unit', e.target.value)}
                      className="h-full px-4 py-3 bg-white border-2 border-primary/20 rounded-2xl text-base font-medium focus:outline-none focus:border-primary/50 appearance-none pr-10"
                    >
                      <option value="kg">kg</option>
                      <option value="lbs">lbs</option>
                      <option value="%">%</option>
                      <option value="@">@</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Tempo */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="text"
                    value="Tempo"
                    readOnly
                    className="w-full px-5 py-3 border-2 border-primary/20 rounded-2xl bg-white text-base"
                  />
                </div>
                <div>
                  <Input
                    type="text"
                    value={simpleValues.tempo}
                    onChange={(e) => handleSimpleValueChange('tempo', e.target.value)}
                    placeholder=""
                    className="w-full px-5 py-3 border-2 border-primary/20 rounded-2xl focus:border-primary/50"
                  />
                </div>
              </div>

              {/* Repos */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="text"
                    value="Repos"
                    readOnly
                    className="w-full px-5 py-3 border-2 border-primary/20 rounded-2xl bg-white text-base"
                  />
                </div>
                <div>
                  <Input
                    type="text"
                    value={simpleValues.rest}
                    onChange={(e) => handleSimpleValueChange('rest', e.target.value)}
                    placeholder=""
                    className="w-full px-5 py-3 border-2 border-primary/20 rounded-2xl focus:border-primary/50"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* MODE DÉTAILLÉ */
            <div className="space-y-4">
              <div className="border-2 border-primary/20 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
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
                <div className="grid grid-cols-5 gap-2 text-sm font-medium text-gray-700 mb-3">
                  <span>#</span>
                  <span>Reps</span>
                  <span>Charge</span>
                  <span>Tempo</span>
                  <span>Repos</span>
                </div>
                {(ex.details ?? []).map((detail, detailIndex) => (
                  <div key={detailIndex} className="grid grid-cols-5 gap-2 mb-2">
                    <div className="flex items-center font-semibold text-gray-800">
                      #{detailIndex + 1}
                    </div>
                    <Input
                      type="text"
                      value={detail.reps}
                      onChange={(e) => onUpdateExercise(ex.id, 'reps', e.target.value, detailIndex)}
                      placeholder="12"
                      className="border-2 border-primary/20 rounded-xl focus:border-primary/50"
                    />
                    <div className="flex gap-1">
                      <Input
                        type="text"
                        value={detail.load.value}
                        onChange={(e) =>
                          onUpdateExercise(ex.id, 'load.value', e.target.value, detailIndex)
                        }
                        placeholder=""
                        className="flex-1 border-2 border-primary/20 rounded-xl focus:border-primary/50"
                      />
                      <select
                        value={detail.load.unit}
                        onChange={(e) =>
                          onUpdateExercise(ex.id, 'load.unit', e.target.value, detailIndex)
                        }
                        className="px-2 py-1 bg-white border-2 border-primary/20 rounded-xl text-sm focus:outline-none focus:border-primary/50"
                      >
                        <option value="kg">kg</option>
                        <option value="lbs">lbs</option>
                        <option value="%">%</option>
                        <option value="@">@</option>
                      </select>
                    </div>
                    <Input
                      type="text"
                      value={detail.tempo}
                      onChange={(e) => onUpdateExercise(ex.id, 'tempo', e.target.value, detailIndex)}
                      placeholder="2010"
                      className="border-2 border-primary/20 rounded-xl focus:border-primary/50"
                    />
                    <Input
                      type="text"
                      value={detail.rest}
                      onChange={(e) => onUpdateExercise(ex.id, 'rest', e.target.value, detailIndex)}
                      placeholder="60s"
                      className="border-2 border-primary/20 rounded-xl focus:border-primary/50"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Élément d'intensification */}
          <div className="mt-3">
            <div className="relative">
              <select
                value={ex.intensification.length > 0 ? ex.intensification[0].value : 'Aucune'}
                onChange={(e) => onUpdateExercise(ex.id, 'intensification', e.target.value)}
                className="w-full px-5 py-3 border-2 border-primary/20 rounded-2xl bg-white text-base focus:outline-none focus:border-primary/50 appearance-none"
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
              <ChevronDownIcon className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Modal des alternatives */}
      {showAlternativesModal && (
        <div className="border-t-2 border-primary/20 p-6 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-base font-semibold text-gray-700">Mouvements alternatifs</h4>
            <button
              type="button"
              onClick={() => setShowAlternativesModal(false)}
              className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded-lg transition-all"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          <Select
            options={availableExercises.map((e) => ({ value: e.id, label: e.name }))}
            value={(ex.alternatives ?? []).map((a) => a.id)}
            onChange={(values) => {
              const selectedAlts = availableExercises.filter((ae) =>
                values.includes(ae.id)
              );
              onUpdateExercise(
                ex.id,
                'alternatives',
                selectedAlts.map((sa) => ({ id: sa.id, name: sa.name }))
              );
            }}
            isMulti
            className="border-2 border-primary/20 rounded-2xl"
          />
          {(ex.alternatives ?? []).length > 0 && (
            <div className="mt-3 text-sm text-gray-600">
              {ex.alternatives.length} alternative{ex.alternatives.length > 1 ? 's' : ''} sélectionnée{ex.alternatives.length > 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExerciseCard;
