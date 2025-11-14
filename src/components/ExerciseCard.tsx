import React, { useState } from 'react';
import { Bars3Icon, TrashIcon, EllipsisHorizontalIcon, FolderIcon } from '@heroicons/react/24/outline';
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
      className={`mb-4 p-4 border rounded-lg bg-white ${
        draggedOverExerciseId === ex.id ? 'border-primary-dark' : ''
      } ${exerciseDragItem.current === ex.id ? 'opacity-50' : ''}`}
    >
      {/* En-tête de l'exercice */}
      <div className="flex items-start gap-3 mb-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelection(ex.id)}
          className="w-4 h-4 mt-3"
        />
        <div className="flex-1">
          {/* Zone de drag and drop visible en pointillés (encadré rouge) */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 hover:border-gray-400 transition-colors bg-gray-50">
            {/* Zone de recherche textuelle intégrée (encadré jaune) */}
            <input
              type="text"
              placeholder="Écrire ou déposer un exercice"
              value={ex.name}
              onChange={(e) => onUpdateExercise(ex.id, 'name', e.target.value)}
              className="w-full px-3 py-2 border-2 border-yellow-400 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 placeholder-gray-400"
            />
          </div>
        </div>
        {ex.illustrationUrl && (
          <img
            src={ex.illustrationUrl}
            alt={ex.name}
            className="w-8 h-8 rounded-full mt-2"
          />
        )}
        <button
          type="button"
          draggable={!isDragInteractionLocked}
          onDragStart={(e) => onDragStart(e, ex.id)}
          onDragEnd={onDragEnd}
          className={`p-1 mt-2 text-gray-400 hover:text-gray-600 ${
            isDragInteractionLocked ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'
          }`}
          onMouseDown={(e) => {
            if (isDragInteractionLocked) {
              e.preventDefault();
            }
          }}
          aria-label="Réordonner l'exercice"
          aria-disabled={isDragInteractionLocked}
        >
          <EllipsisHorizontalIcon className="w-4 h-4" />
        </button>
        {ex.exerciseId && (
          <button
            type="button"
            onClick={onOpenHistory}
            className="p-1 hover:bg-gray-100 rounded-full mt-2"
            title="Voir l'historique du client"
          >
            <FolderIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex justify-end items-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => onDeleteExercise(ex.id)}
          className="p-1 hover:bg-red-100 rounded-full"
          title="Supprimer l'exercice"
        >
          <TrashIcon className="w-4 h-4 text-red-600" />
        </button>
      </div>

      {/* Mode Simple ou Détaillé */}
      {!isDetailedMode ? (
        /* MODE SIMPLE */
        <div className="space-y-4">
          <div className="grid grid-cols-5 gap-4">
            {/* Séries */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                Séries
                <button
                  type="button"
                  onClick={toggleDetailedMode}
                  className="p-1 rounded-full bg-red-500 hover:bg-red-600 text-white"
                  title="Passer en mode détaillé"
                >
                  <Bars3Icon className="w-3 h-3" />
                </button>
              </label>
              <Input
                type="number"
                value={ex.sets}
                onChange={(e) => onUpdateExercise(ex.id, 'sets', e.target.value)}
                placeholder="4"
              />
            </div>

            {/* Répétitions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Répétitions
              </label>
              <Input
                type="text"
                value={simpleValues.reps}
                onChange={(e) => handleSimpleValueChange('reps', e.target.value)}
                placeholder="12"
              />
            </div>

            {/* Charge */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Charge
              </label>
              <div className="flex gap-1">
                <Input
                  type="text"
                  value={simpleValues.load.value}
                  onChange={(e) => handleSimpleValueChange('load.value', e.target.value)}
                  placeholder=""
                  className="flex-1"
                />
                <select
                  value={simpleValues.load.unit}
                  onChange={(e) => handleSimpleValueChange('load.unit', e.target.value)}
                  className="px-2 py-1 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                >
                  <option value="kg">kg</option>
                  <option value="lbs">lbs</option>
                  <option value="%">%</option>
                  <option value="@">@</option>
                </select>
              </div>
            </div>

            {/* Tempo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tempo
              </label>
              <Input
                type="text"
                value={simpleValues.tempo}
                onChange={(e) => handleSimpleValueChange('tempo', e.target.value)}
                placeholder="2010"
              />
            </div>

            {/* Repos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Repos
              </label>
              <Input
                type="text"
                value={simpleValues.rest}
                onChange={(e) => handleSimpleValueChange('rest', e.target.value)}
                placeholder="60s"
              />
            </div>
          </div>
        </div>
      ) : (
        /* MODE DÉTAILLÉ */
        <div className="space-y-4">
          <div className="border-2 border-red-500 rounded-lg p-4">
            <div className="grid grid-cols-4 gap-2 text-sm font-medium text-gray-700 mb-3">
              <div className="flex items-center gap-2">
                <span>Série</span>
                <button
                  type="button"
                  onClick={toggleDetailedMode}
                  className="p-1 rounded-full bg-red-500 hover:bg-red-600 text-white"
                  title="Revenir en mode simple"
                >
                  <Bars3Icon className="w-3 h-3" />
                </button>
              </div>
              <span>Reps</span>
              <span>Charge</span>
              <span>Repos</span>
            </div>
            {(ex.details ?? []).map((detail, detailIndex) => (
              <div key={detailIndex} className="grid grid-cols-4 gap-2 mb-2">
                <div className="flex items-center font-semibold text-gray-800">
                  #{detailIndex + 1}
                </div>
                <Input
                  type="text"
                  value={detail.reps}
                  onChange={(e) => onUpdateExercise(ex.id, 'reps', e.target.value, detailIndex)}
                  placeholder="12"
                />
                <div className="flex gap-1">
                  <Input
                    type="text"
                    value={detail.load.value}
                    onChange={(e) =>
                      onUpdateExercise(ex.id, 'load.value', e.target.value, detailIndex)
                    }
                    placeholder=""
                    className="flex-1"
                  />
                  <select
                    value={detail.load.unit}
                    onChange={(e) =>
                      onUpdateExercise(ex.id, 'load.unit', e.target.value, detailIndex)
                    }
                    className="px-2 py-1 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  >
                    <option value="kg">kg</option>
                    <option value="lbs">lbs</option>
                    <option value="%">%</option>
                    <option value="@">@</option>
                  </select>
                </div>
                <Input
                  type="text"
                  value={detail.rest}
                  onChange={(e) => onUpdateExercise(ex.id, 'rest', e.target.value, detailIndex)}
                  placeholder="60s"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Intensification et Alternative */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Intensification
          </label>
          <Select
            options={[
              { value: 'Aucune', label: 'Aucune' },
              { value: 'Dégressif', label: 'Dégressif' },
              { value: 'Superset', label: 'Superset' },
              { value: 'Dropset', label: 'Dropset' },
              { value: 'Rest-Pause', label: 'Rest-Pause' },
              { value: 'Myo-reps', label: 'Myo-reps' },
              { value: 'Cluster', label: 'Cluster' },
              { value: 'Partielles', label: 'Partielles' },
              { value: 'Tempo', label: 'Tempo' },
              { value: 'Isometric', label: 'Isometric' },
            ]}
            value={ex.intensification.length > 0 ? ex.intensification[0].value : 'Aucune'}
            onChange={(value) => onUpdateExercise(ex.id, 'intensification', value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Alternative
          </label>
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
          />
        </div>
      </div>
    </div>
  );
};

export default ExerciseCard;
