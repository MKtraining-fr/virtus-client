import React from 'react';
import { ArrowLeftIcon, EllipsisVerticalIcon, PlayCircleIcon, ArrowsRightLeftIcon } from '../../../constants/icons';
import type { WorkoutExercise, Exercise } from '../../../types';

interface ExerciseHeaderProps {
  exercise: WorkoutExercise | null;
  fullExerciseDetails: Exercise | null;
  onBack: () => void;
  onOptionsClick: () => void;
  onVideoClick: () => void;
  onAlternativesClick: () => void;
}

const ExerciseHeader: React.FC<ExerciseHeaderProps> = ({
  exercise,
  fullExerciseDetails,
  onBack,
  onOptionsClick,
  onVideoClick,
  onAlternativesClick,
}) => {
  if (!exercise) {
    return (
      <div className="bg-bg-primary p-4 border-b border-gray-800">
        <div className="text-center text-text-tertiary">Chargement...</div>
      </div>
    );
  }

  const getDisplayValue = (key: 'reps' | 'tempo' | 'rest') => {
    if (!exercise.details || exercise.details.length === 0) return 'N/A';
    const firstValue = exercise.details[0][key];
    const allSame = exercise.details.every((d) => d[key] === firstValue);
    if (allSame) return firstValue;
    return exercise.details.map((d) => d[key]).join(' / ');
  };

  const displayReps = getDisplayValue('reps');
  const displayTempo = getDisplayValue('tempo');
  const displayRest = getDisplayValue('rest');

  return (
    <div className="bg-bg-primary p-4 border-b border-gray-800">
      {/* Header avec titre et boutons */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="text-text-primary hover:text-brand-primary transition-colors p-2"
          aria-label="Retour"
        >
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
        
        <h1 className="text-xl font-bold text-text-primary text-center flex-1 px-4">
          {exercise.name}
        </h1>
        
        <button
          onClick={onOptionsClick}
          className="text-text-primary hover:text-brand-primary transition-colors p-2"
          aria-label="Options"
        >
          <EllipsisVerticalIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Protocole */}
      <div className="bg-bg-card rounded-xl p-4 flex items-center gap-4">
        {/* Thumbnail vidéo */}
        {fullExerciseDetails?.youtubeUrl && (
          <div
            className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer group"
            onClick={onVideoClick}
          >
            <div className="w-full h-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center">
              <PlayCircleIcon className="w-10 h-10 text-white group-hover:scale-110 transition-transform" />
            </div>
          </div>
        )}

        {/* Informations */}
        <div className="flex-1 min-w-0">
          <div className="text-text-primary font-semibold mb-1">
            {exercise.sets} séries • {displayReps} reps
          </div>
          <div className="text-text-tertiary text-sm">
            Tempo {displayTempo} • Repos {displayRest}s
          </div>
          
          {/* Boutons d'action */}
          <div className="flex gap-2 mt-3">
            {fullExerciseDetails?.youtubeUrl && (
              <button
                onClick={onVideoClick}
                className="px-3 py-1.5 bg-brand-primary hover:bg-brand-secondary text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
              >
                <PlayCircleIcon className="w-4 h-4" />
                Voir vidéo
              </button>
            )}
            
            {fullExerciseDetails?.alternativeIds && fullExerciseDetails.alternativeIds.length > 0 && (
              <button
                onClick={onAlternativesClick}
                className="px-3 py-1.5 bg-brand-primary hover:bg-brand-secondary text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
              >
                <ArrowsRightLeftIcon className="w-4 h-4" />
                Alternatifs
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExerciseHeader;
