import React from 'react';
import { CheckIcon } from '../../../constants/icons';

const ChevronRightIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
  </svg>
);

interface ActionButtonsProps {
  onComplete: () => void;
  onNext?: () => void;
  isLastExercise?: boolean;
  canComplete: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  onComplete,
  onNext,
  isLastExercise = false,
  canComplete,
}) => {
  return (
    <div className="bg-bg-primary border-t border-gray-800 p-4 space-y-3">
      {/* Bouton principal - Terminer l'exercice */}
      <button
        onClick={onComplete}
        disabled={!canComplete}
        className={`
          w-full py-4 rounded-xl font-bold text-lg transition-all
          ${canComplete
            ? 'bg-gradient-to-r from-accent-orange to-red-500 hover:from-accent-orange/90 hover:to-red-500/90 text-white shadow-lg shadow-accent-orange/30'
            : 'bg-gray-700 text-text-disabled cursor-not-allowed'
          }
        `}
      >
        <div className="flex items-center justify-center gap-2">
          <CheckIcon className="w-6 h-6" />
          <span>Terminer l'exercice</span>
        </div>
      </button>

      {/* Bouton secondaire - Exercice suivant */}
      {!isLastExercise && onNext && (
        <button
          onClick={onNext}
          className="w-full py-3 bg-bg-card hover:bg-gray-700 text-text-primary rounded-xl font-medium transition-colors border border-gray-700"
        >
          <div className="flex items-center justify-center gap-2">
            <span>Exercice suivant</span>
            <ChevronRightIcon className="w-5 h-5" />
          </div>
        </button>
      )}

      {/* Indicateur de progression */}
      <div className="text-center text-text-tertiary text-sm">
        {canComplete ? (
          <span className="text-accent-green">✓ Toutes les séries sont complétées</span>
        ) : (
          <span>Complétez toutes les séries pour continuer</span>
        )}
      </div>
    </div>
  );
};

export default ActionButtons;
